"""
Data Merger Module
==================
Merges HAM10000 and ISIC 2019 datasets while removing duplicates.

Design Decisions:
- Dermoscopic-only (no clinical/smartphone photos)
- Duplicate removal: ISIC 2019 contains some HAM10000 images
- Label harmonization: ISIC uses one-hot encoding, HAM uses dx column

Author: [Your Name]
Date: February 2026
"""

import pandas as pd
import numpy as np
from pathlib import Path
import logging
from typing import Tuple, Dict
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataMerger:
    """
    Merges HAM10000 and ISIC 2019 datasets with duplicate detection.
    
    Attributes:
        raw_dir (Path): Path to raw data directory
        processed_dir (Path): Path to save processed metadata
        
    Methods:
        harmonize_isic_labels: Convert ISIC one-hot encoding to dx format
        remove_duplicates: Remove HAM10000 images that appear in ISIC
        merge_datasets: Main pipeline to combine both datasets
    """
    
    def __init__(self, raw_dir: Path, processed_dir: Path):
        """
        Initialize DataMerger.
        
        Args:
            raw_dir: Path to data/raw directory
            processed_dir: Path to data/processed directory
            
        Raises:
            FileNotFoundError: If raw_dir doesn't exist
        """
        self.raw_dir = Path(raw_dir)
        self.processed_dir = Path(processed_dir)
        
        if not self.raw_dir.exists():
            raise FileNotFoundError(f"Raw data directory not found: {raw_dir}")
        
        # Create processed dir if needed
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"DataMerger initialized")
        logger.info(f"  Raw directory: {self.raw_dir}")
        logger.info(f"  Processed directory: {self.processed_dir}")
    
    def harmonize_isic_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convert ISIC 2019 one-hot encoded labels to dx format.
        
        ISIC 2019 GroundTruth has columns: MEL, NV, BCC, AK, BKL, DF, VASC, SCC
        We need to convert to: mel, nv, bcc, akiec, bkl, df, vasc, scc
        
        Args:
            df: ISIC 2019 DataFrame with one-hot columns
            
        Returns:
            DataFrame with added 'dx' column
            
        Example:
            >>> isic_df = pd.DataFrame({
            ...     'image': ['ISIC_0000001'],
            ...     'MEL': [1], 'NV': [0], 'BCC': [0], ...
            ... })
            >>> result = harmonize_isic_labels(isic_df)
            >>> print(result['dx'].values)
            ['mel']
        """
        # Define one-hot columns and their mappings
        label_columns = ['MEL', 'NV', 'BCC', 'AK', 'BKL', 'DF', 'VASC', 'SCC']
        
        # Check all columns exist
        missing_cols = set(label_columns) - set(df.columns)
        if missing_cols:
            raise ValueError(f"Missing label columns in ISIC data: {missing_cols}")
        
        # Find which column has 1 for each row (argmax)
        df['dx'] = df[label_columns].idxmax(axis=1).str.lower()
        
        # Map 'ak' to 'akiec' (actinic keratosis naming convention)
        df['dx'] = df['dx'].replace({'ak': 'akiec'})
        
        logger.info(f"ISIC label harmonization complete")
        logger.info(f"  Class distribution:\n{df['dx'].value_counts()}")
        
        return df
    
    def remove_duplicates(
        self, 
        ham_df: pd.DataFrame, 
        isic_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Remove HAM10000 images that appear in ISIC 2019.
        
        Why: ISIC 2019 contains images from multiple sources including HAM10000.
        We want to avoid data leakage (same lesion in train and test).
        
        Args:
            ham_df: HAM10000 DataFrame
            isic_df: ISIC 2019 DataFrame
            
        Returns:
            De-duplicated ISIC DataFrame
            
        Note:
            HAM images have IDs starting with 'ISIC_' (e.g., ISIC_0024306)
            We check for these in ISIC 2019 and remove them.
        """
        initial_isic_count = len(isic_df)
        
        # Find HAM image IDs in ISIC
        ham_image_ids = set(ham_df['image_id'].values)
        
        # Remove duplicates
        isic_df = isic_df[~isic_df['image_id'].isin(ham_image_ids)]
        
        duplicates_removed = initial_isic_count - len(isic_df)
        
        logger.info(f"Duplicate removal complete")
        logger.info(f"  Initial ISIC count: {initial_isic_count}")
        logger.info(f"  Duplicates found: {duplicates_removed}")
        logger.info(f"  Final ISIC count: {len(isic_df)}")
        
        return isic_df
    
    def merge_datasets(self) -> Tuple[pd.DataFrame, Dict[str, int]]:
        """
        Main pipeline: Load, harmonize, deduplicate, and merge datasets.
        
        Returns:
            Tuple of (merged_df, statistics_dict)
            
        Raises:
            FileNotFoundError: If HAM or ISIC metadata files missing
        """
        logger.info("="*60)
        logger.info("STARTING DATA MERGER PIPELINE")
        logger.info("="*60)
        
        # -------------------------------------------------------------------
        # Step 1: Load HAM10000
        # -------------------------------------------------------------------
        ham_path = self.raw_dir / "HAM_10000" / "HAM10000_metadata.csv"
        if not ham_path.exists():
            raise FileNotFoundError(f"HAM10000 metadata not found: {ham_path}")
        
        logger.info(f"\n[1/4] Loading HAM10000 from {ham_path}")
        ham_df = pd.read_csv(ham_path)
        ham_df = ham_df[['image_id', 'dx']]  # Keep only essential columns
        ham_df['source'] = 'ham10000'
        
        logger.info(f"  ✓ Loaded {len(ham_df)} HAM10000 images")
        
        # -------------------------------------------------------------------
        # Step 2: Load ISIC 2019
        # -------------------------------------------------------------------
        isic_path = self.raw_dir / "ISIC_2019" / "ISIC_2019_Training_GroundTruth.csv"
        if not isic_path.exists():
            raise FileNotFoundError(f"ISIC 2019 metadata not found: {isic_path}")
        
        logger.info(f"\n[2/4] Loading ISIC 2019 from {isic_path}")
        isic_df = pd.read_csv(isic_path)
        isic_df = isic_df.rename(columns={'image': 'image_id'})
        
        logger.info(f"  ✓ Loaded {len(isic_df)} ISIC 2019 images")
        
        # -------------------------------------------------------------------
        # Step 3: Harmonize labels
        # -------------------------------------------------------------------
        logger.info(f"\n[3/4] Harmonizing ISIC labels (one-hot → dx format)")
        isic_df = self.harmonize_isic_labels(isic_df)
        isic_df = isic_df[['image_id', 'dx']]  # Keep only essential columns
        isic_df['source'] = 'isic2019'
        
        # -------------------------------------------------------------------
        # Step 4: Remove duplicates
        # -------------------------------------------------------------------
        logger.info(f"\n[4/4] Removing HAM10000 duplicates from ISIC")
        isic_df = self.remove_duplicates(ham_df, isic_df)
        
        # -------------------------------------------------------------------
        # Step 5: Merge
        # -------------------------------------------------------------------
        logger.info(f"\nMerging datasets...")
        master_df = pd.concat([ham_df, isic_df], ignore_index=True)
        
        # -------------------------------------------------------------------
        # Step 6: Statistics
        # -------------------------------------------------------------------
        stats = {
            'total_images': len(master_df),
            'ham10000_count': len(ham_df),
            'isic2019_count': len(isic_df),
            'class_distribution': master_df['dx'].value_counts().to_dict(),
            'source_distribution': master_df['source'].value_counts().to_dict()
        }
        
        logger.info(f"\n{'='*60}")
        logger.info(f"MERGE COMPLETE!")
        logger.info(f"{'='*60}")
        logger.info(f"Total images: {stats['total_images']:,}")
        logger.info(f"  - HAM10000: {stats['ham10000_count']:,}")
        logger.info(f"  - ISIC 2019: {stats['isic2019_count']:,}")
        
        logger.info(f"\nClass Distribution:")
        for cls, count in sorted(stats['class_distribution'].items(), 
                                  key=lambda x: x[1], reverse=True):
            percentage = (count / stats['total_images']) * 100
            logger.info(f"  {cls:6s}: {count:5,} ({percentage:5.2f}%)")
        
        # Calculate new imbalance ratio
        max_class = max(stats['class_distribution'].values())
        min_class = min(stats['class_distribution'].values())
        imbalance_ratio = max_class / min_class
        
        logger.info(f"\nImbalance Analysis:")
        logger.info(f"  Majority class: {max_class:,} images")
        logger.info(f"  Minority class: {min_class:,} images")
        logger.info(f"  Imbalance ratio: {imbalance_ratio:.1f}:1")
        logger.info(f"  (Original HAM only: 58.3:1) ← IMPROVED!")
        
        # -------------------------------------------------------------------
        # Step 7: Save
        # -------------------------------------------------------------------
        output_path = self.processed_dir / "master_metadata.csv"
        master_df.to_csv(output_path, index=False)
        logger.info(f"\n✓ Saved to: {output_path}")
        
        return master_df, stats


def main():
    """
    Main execution script.
    
    Usage:
        python src/preprocessing/data_merger.py
    """
    # Define paths (adjust if running from different directory)
    project_root = Path(__file__).parent.parent.parent  # ml_core/
    raw_dir = project_root / "data" / "raw"
    processed_dir = project_root / "data" / "processed"
    
    try:
        # Initialize merger
        merger = DataMerger(raw_dir, processed_dir)
        
        # Execute merge
        merged_df, stats = merger.merge_datasets()
        
        print("\n" + "="*60)
        print("SUCCESS! Ready for stratified splitting (next step)")
        print("="*60)
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        logger.error("Please verify dataset paths and try again")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise


if __name__ == "__main__":
    main()
