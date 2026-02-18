"""
Configuration Manager
=====================
Handles loading and accessing configuration from YAML files.

Features:
- Type-safe configuration access
- Environment variable overrides
- Validation of critical paths

"""

import yaml
from pathlib import Path
from typing import Any, Dict, Optional
import logging
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Config:
    """
    Configuration container with dot-notation access.
    
    Example:
        >>> config = Config.from_yaml('config/config.yaml')
        >>> print(config.dataset.image_size)
        224
        >>> print(config.paths.train_csv)
        'data/processed/train.csv'
    """
    
    def __init__(self, config_dict: Dict[str, Any]):
        """
        Initialize configuration from dictionary.
        
        Args:
            config_dict: Nested dictionary from YAML
        """
        for key, value in config_dict.items():
            if isinstance(value, dict):
                setattr(self, key, Config(value))
            else:
                setattr(self, key, value)
    
    @classmethod
    def from_yaml(cls, yaml_path: str) -> 'Config':
        """
        Load configuration from YAML file.
        
        Args:
            yaml_path: Path to config.yaml
            
        Returns:
            Config object with nested attributes
            
        Raises:
            FileNotFoundError: If YAML file doesn't exist
            yaml.YAMLError: If YAML is malformed
            
        Example:
            >>> config = Config.from_yaml('config/config.yaml')
        """
        yaml_path = Path(yaml_path)
        
        if not yaml_path.exists():
            raise FileNotFoundError(f"Config file not found: {yaml_path}")
        
        logger.info(f"Loading configuration from {yaml_path}")
        
        with open(yaml_path, 'r') as f:
            config_dict = yaml.safe_load(f)
        
        return cls(config_dict)
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get configuration value with optional default.
        
        Args:
            key: Configuration key (supports dot notation: 'paths.train_csv')
            default: Default value if key not found
            
        Returns:
            Configuration value or default
            
        Example:
            >>> config.get('dataset.image_size', 256)
            224
        """
        keys = key.split('.')
        value = self
        
        try:
            for k in keys:
                value = getattr(value, k)
            return value
        except AttributeError:
            return default
    
    def validate_paths(self, base_path: Optional[Path] = None):
        """
        Validate that critical paths exist.
        
        Args:
            base_path: Base directory for relative paths (default: current dir)
            
        Raises:
            FileNotFoundError: If critical files/directories missing
        """
        if base_path is None:
            base_path = Path.cwd()
        
        logger.info("Validating configuration paths...")
        
        # Check critical files
        critical_files = [
            self.paths.train_csv,
            self.paths.val_csv,
            self.paths.test_csv
        ]
        
        for file_path in critical_files:
            full_path = base_path / file_path
            if not full_path.exists():
                raise FileNotFoundError(
                    f"Critical file missing: {full_path}\n"
                    f"Please run data preprocessing scripts first."
                )
        
        # Check critical directories
        critical_dirs = [
            self.paths.ham_images,
            self.paths.isic_images
        ]
        
        for dir_path in critical_dirs:
            full_path = base_path / dir_path
            if not full_path.exists():
                logger.warning(f"Image directory not found: {full_path}")
        
        logger.info("✓ Configuration validation complete")
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert Config back to dictionary.
        
        Returns:
            Nested dictionary representation
        """
        result = {}
        for key, value in self.__dict__.items():
            if isinstance(value, Config):
                result[key] = value.to_dict()
            else:
                result[key] = value
        return result
    
    def __repr__(self) -> str:
        """String representation of configuration."""
        return f"Config({self.to_dict()})"


def load_config(config_path: str = "config/config.yaml") -> Config:
    
    """
    Convenience function to load configuration.
    
    Args:
        config_path: Path to YAML configuration file
        
    Returns:
        Config object
        
    Example:
        >>> from src.utils.config import load_config
        >>> config = load_config()
        >>> print(config.dataset.num_classes)
        8
    """
    config = Config.from_yaml(config_path)
    # Normalize mapping fields to plain dictionaries
    if hasattr(config.dataset, "class_to_idx"):
        config.dataset.class_to_idx = config.dataset.class_to_idx.to_dict()

    return config
    


# Example usage
if __name__ == "__main__":
    # Load config
    project_root = Path(__file__).parent.parent.parent
    config_path = project_root / "config" / "config.yaml"
    
    config = Config.from_yaml(str(config_path))
    
    # Test access patterns
    print("\n" + "="*60)
    print("CONFIGURATION LOADED")
    print("="*60)
    print(f"Project: {config.project.name} v{config.project.version}")
    print(f"Random seed: {config.project.random_seed}")
    print(f"Image size: {config.dataset.image_size}")
    print(f"Batch size: {config.training.batch_size}")
    print(f"Number of classes: {config.dataset.num_classes}")
    print(f"Class names: {config.dataset.class_names}")
    
    # Validate paths (will warn about missing directories)
    try:
        config.validate_paths(project_root)
    except FileNotFoundError as e:
        print(f"\n⚠ Validation warning: {e}")
    
    print("\n Configuration module test complete")
