# setup.py
from setuptools import setup, find_packages

setup(
    name="obra-system",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "Flask==2.3.3",
        "pandas==2.0.3",
        "numpy==1.24.3",
        "openpyxl==3.1.2",
    ],
)