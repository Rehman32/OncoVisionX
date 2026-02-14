"""
Stratified Data Splitter
========================
Splits merged dataset into train/validation/test sets with stratification.

Key Concepts:
- Stratified splitting maintains class distribution across all splits
- Critical for imbalanced datasets (prevents rare class disappearance)
- Random state ensures reproducibility

Split Ratios: 70% train / 15% validation / 15% test


"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
import logging
from typing import Tuple, Dict
import matplotlib.pyplot as plt
import seaborn as sns

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StratifiedDataSplitter:
    """
    Performs stratified splitting of dermatology dataset.
    
    Why Stratified?
    ---------------
    With severe class imbalance (50:1 ratio), random splitting can:
    1. Accidentally exclude rare classes from validation/test
    2. Create unrepresentative evaluation sets
    3. Produce unreliable performance metrics
    
    Solution: Stratify by 'dx' column to ensure each split mirrors
             the original class distribution.
    
    Attributes:
        metadata_path (Path): Path to master_metadata.csv
        output_dir (Path): Where to save train/val/test CSVs
        random_state (int): Seed for reproducibility
        train_ratio (float): Training set proportion
        val_ratio (float): Validation set proportion
        test_ratio (float): Test set proportion
    """
    
    def __init__(
        self,
        metadata_path: Path,
        output_dir: Path,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        random_state: int = 42
    ):
        """
        Initialize splitter with configuration.
        
        Args:
            metadata_path: Path to master_metadata.csv
            output_dir: Directory to save split CSVs
            train_ratio: Training set proportion (default: 0.70)
            val_ratio: Validation set proportion (default: 0.15)
            test_ratio: Test set proportion (default: 0.15)
            random_state: Random seed for reproducibility (default: 42)
            
        Raises:
            ValueError: If ratios don't sum to 1.0
            FileNotFoundError: If metadata_path doesn't exist
        """
        # Validate ratios
        if not np.isclose(train_ratio + val_ratio + test_ratio, 1.0):
            raise ValueError(
                f"Ratios must sum to 1.0, got {train_ratio + val_ratio + test_ratio}"
            )
        
        self.metadata_path = Path(metadata_path)
        self.output_dir = Path(output_dir)
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = test_ratio
        self.random_state = random_state
        
        if not self.metadata_path.exists():
            raise FileNotFoundError(f"Metadata not found: {metadata_path}")
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("StratifiedDataSplitter initialized")
        logger.info(f"  Metadata: {self.metadata_path}")
        logger.info(f"  Output: {self.output_dir}")
        logger.info(f"  Split ratios: {train_ratio:.0%} / {val_ratio:.0%} / {test_ratio:.0%}")
        logger.info(f"  Random state: {random_state}")
    
    def split_data(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Perform stratified splitting.
        
        Algorithm:
        1. Load metadata
        2. First split: train vs (val + test) - stratified by dx
        3. Second split: val vs test - stratified by dx
        
        Returns:
            Tuple of (train_df, val_df, test_df)
            
        Note:
            Uses sklearn.model_selection.train_test_split with stratify parameter
        """
        logger.info("\n" + "="*60)
        logger.info("STARTING STRATIFIED SPLITTING")
        logger.info("="*60)
        
        # Load metadata
        logger.info(f"\n[1/3] Loading metadata from {self.metadata_path}")
        df = pd.read_csv(self.metadata_path)
        logger.info(f"  ✓ Loaded {len(df):,} images")
        
        # Display original distribution
        logger.info(f"\n[2/3] Original class distribution:")
        original_dist = df['dx'].value_counts()
        for cls, count in original_dist.items():
            pct = (count / len(df)) * 100
            logger.info(f"  {cls:6s}: {count:5,} ({pct:5.2f}%)")
        
        # First split: train vs (val + test)
        logger.info(f"\n[3/3] Performing stratified splitting...")
        temp_ratio = self.val_ratio + self.test_ratio  # 0.15 + 0.15 = 0.30
        
        train_df, temp_df = train_test_split(
            df,
            test_size=temp_ratio,
            stratify=df['dx'],
            random_state=self.random_state
        )
        
        logger.info(f"  ✓ Train set: {len(train_df):,} images ({len(train_df)/len(df)*100:.1f}%)")
        logger.info(f"  ✓ Temp set (val+test): {len(temp_df):,} images")
        
        # Second split: val vs test
        val_df, test_df = train_test_split(
            temp_df,
            test_size=0.5,  # Split temp equally (15% each of total)
            stratify=temp_df['dx'],
            random_state=self.random_state
        )
        
        logger.info(f"  ✓ Validation set: {len(val_df):,} images ({len(val_df)/len(df)*100:.1f}%)")
        logger.info(f"  ✓ Test set: {len(test_df):,} images ({len(test_df)/len(df)*100:.1f}%)")
        
        return train_df, val_df, test_df
    
    def verify_stratification(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        test_df: pd.DataFrame
    ) -> Dict[str, pd.DataFrame]:
        """
        Verify that stratification maintained class proportions.
        
        Args:
            train_df: Training set DataFrame
            val_df: Validation set DataFrame
            test_df: Test set DataFrame
            
        Returns:
            Dictionary with comparison DataFrames
        """
        logger.info("\n" + "="*60)
        logger.info("STRATIFICATION VERIFICATION")
        logger.info("="*60)
        
        # Compute percentages for each split
        def get_percentages(df, name):
            counts = df['dx'].value_counts().sort_index()
            total = len(df)
            percentages = (counts / total * 100).round(2)
            return pd.Series(percentages, name=name)
        
        # Combine into comparison table
        comparison = pd.DataFrame({
            'Train %': get_percentages(train_df, 'Train'),
            'Val %': get_percentages(val_df, 'Val'),
            'Test %': get_percentages(test_df, 'Test')
        })
        
        # Add absolute counts
        comparison['Train Count'] = train_df['dx'].value_counts().sort_index()
        comparison['Val Count'] = val_df['dx'].value_counts().sort_index()
        comparison['Test Count'] = test_df['dx'].value_counts().sort_index()
        
        # Compute max deviation
        comparison['Max Deviation'] = comparison[['Train %', 'Val %', 'Test %']].max(axis=1) - \
                                       comparison[['Train %', 'Val %', 'Test %']].min(axis=1)
        
        logger.info("\nClass Distribution Across Splits:")
        logger.info("\n" + comparison.to_string())
        
        # Check if deviation is acceptable (< 2% for all classes)
        max_deviation = comparison['Max Deviation'].max()
        logger.info(f"\nMax percentage deviation: {max_deviation:.2f}%")
        
        if max_deviation < 2.0:
            logger.info("✓ Stratification EXCELLENT (all classes within 2%)")
        elif max_deviation < 5.0:
            logger.info("✓ Stratification GOOD (all classes within 5%)")
        else:
            logger.warning("⚠ Stratification suboptimal (deviation > 5%)")
            logger.warning("  This may occur with very rare classes")
        
        return {
            'comparison': comparison,
            'train_dist': train_df['dx'].value_counts(),
            'val_dist': val_df['dx'].value_counts(),
            'test_dist': test_df['dx'].value_counts()
        }
    
    def save_splits(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        test_df: pd.DataFrame
    ):
        """
        Save train/val/test CSVs to output directory.
        
        Args:
            train_df: Training set
            val_df: Validation set
            test_df: Test set
        """
        logger.info("\n" + "="*60)
        logger.info("SAVING SPLITS")
        logger.info("="*60)
        
        # Save CSVs
        train_path = self.output_dir / "train.csv"
        val_path = self.output_dir / "val.csv"
        test_path = self.output_dir / "test.csv"
        
        train_df.to_csv(train_path, index=False)
        val_df.to_csv(val_path, index=False)
        test_df.to_csv(test_path, index=False)
        
        logger.info(f"✓ Saved train set: {train_path} ({len(train_df):,} images)")
        logger.info(f"✓ Saved val set: {val_path} ({len(val_df):,} images)")
        logger.info(f"✓ Saved test set: {test_path} ({len(test_df):,} images)")
    
    def visualize_splits(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        test_df: pd.DataFrame
    ):
        """
        Create visualization comparing class distributions.
        
        Args:
            train_df: Training set
            val_df: Validation set
            test_df: Test set
        """
        logger.info("\n[VISUALIZATION] Creating split comparison plot...")
        
        # Prepare data
        splits_data = []
        for name, df in [('Train', train_df), ('Val', val_df), ('Test', test_df)]:
            for cls in df['dx'].unique():
                count = (df['dx'] == cls).sum()
                pct = (count / len(df)) * 100
                splits_data.append({
                    'Split': name,
                    'Class': cls,
                    'Percentage': pct
                })
        
        plot_df = pd.DataFrame(splits_data)
        
        # Create plot
        fig, ax = plt.subplots(figsize=(14, 6))
        
        # Grouped bar chart
        x = np.arange(len(plot_df['Class'].unique()))
        width = 0.25
        
        classes = sorted(plot_df['Class'].unique())
        train_pcts = [plot_df[(plot_df['Split']=='Train') & (plot_df['Class']==c)]['Percentage'].values[0] 
                      for c in classes]
        val_pcts = [plot_df[(plot_df['Split']=='Val') & (plot_df['Class']==c)]['Percentage'].values[0] 
                    for c in classes]
        test_pcts = [plot_df[(plot_df['Split']=='Test') & (plot_df['Class']==c)]['Percentage'].values[0] 
                     for c in classes]
        
        ax.bar(x - width, train_pcts, width, label='Train', color='steelblue')
        ax.bar(x, val_pcts, width, label='Val', color='orange')
        ax.bar(x + width, test_pcts, width, label='Test', color='green')
        
        ax.set_xlabel('Diagnosis Class', fontsize=12, fontweight='bold')
        ax.set_ylabel('Percentage (%)', fontsize=12, fontweight='bold')
        ax.set_title('Stratified Split Verification: Class Distribution Across Train/Val/Test', 
                     fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(classes, rotation=0)
        ax.legend()
        ax.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        
        # Save plot
        plot_path = self.output_dir.parent.parent / "logs" / "stratified_splits.png"
        plot_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(plot_path, dpi=150, bbox_inches='tight')
        logger.info(f"✓ Saved visualization: {plot_path}")
        
        plt.close()
    
    def run_pipeline(self):
        """
        Execute complete splitting pipeline.
        
        Steps:
        1. Split data with stratification
        2. Verify stratification quality
        3. Save splits to CSV
        4. Generate visualization
        """
        # Split
        train_df, val_df, test_df = self.split_data()
        
        # Verify
        verification = self.verify_stratification(train_df, val_df, test_df)
        
        # Save
        self.save_splits(train_df, val_df, test_df)
        
        # Visualize
        self.visualize_splits(train_df, val_df, test_df)
        
        logger.info("\n" + "="*60)
        logger.info("PIPELINE COMPLETE!")
        logger.info("="*60)
        logger.info(f"\nNext steps:")
        logger.info(f"  1. Verify splits in data/processed/")
        logger.info(f"  2. Review visualization in logs/")
        logger.info(f"  3. Proceed to Phase 2: Quality Gate implementation")


def main():
    """
    Main execution script.
    
    Usage:
        python src/preprocessing/data_splitter.py
    """
    # Define paths
    project_root = Path(__file__).parent.parent.parent  # ml_core/
    metadata_path = project_root / "data" / "processed" / "master_metadata.csv"
    output_dir = project_root / "data" / "processed"
    
    try:
        # Initialize splitter
        splitter = StratifiedDataSplitter(
            metadata_path=metadata_path,
            output_dir=output_dir,
            train_ratio=0.70,
            val_ratio=0.15,
            test_ratio=0.15,
            random_state=42  # For reproducibility
        )
        
        # Run pipeline
        splitter.run_pipeline()
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        logger.error("Please run data_merger.py first")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise


if __name__ == "__main__":
    main()
