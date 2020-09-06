import sys
import shutil
import onclick_signer

from pathlib import Path
from setuptools import Command, setup, find_packages
from subprocess import check_call, CalledProcessError

this_dir = Path(__file__).parent.absolute()

# Get the long description from the README file
with this_dir.joinpath('README.md').open(encoding='utf-8') as f:
    long_description = f.read()


def requirements_to_list(filename):
    return [dep for dep in this_dir.joinpath(filename).open().read().split('\n') if (
        dep and not dep.startswith('#')
    )]


setup(
    name='onclick_signer',
    version=onclick_signer.__version__,
    description='Terrible task manager for large touch screens',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/mikeshultz/onclick-money',
    author=onclick_signer.__author__,
    author_email=onclick_signer.__email__,
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
    ],
    keywords='onclick money token ethereum blockchain',
    packages=find_packages(exclude=['docs', 'tests', 'scripts', 'build']),
    install_requires=requirements_to_list('requirements.txt'),
    extras_require={
        'test': requirements_to_list('requirements.test.txt'),
    },
    entry_points={
        'console_scripts': [
            'ocsigner=onclick_signer.cli:main',
        ],
    },
    package_data={
        '': [
            'README.md',
        ],
    }
)
