#!/usr/bin/env python
"""The setup script."""

from setuptools import find_packages, setup

install_requires_replacements = {}

requirements = list(set(
    install_requires_replacements.get(requirement.strip(), requirement.strip())
    for requirement in open('requirements.txt') if not requirement.lstrip().startswith('#')
))

setup_requirements = ['pytest-runner', ]

test_requirements = ['pytest', ]

setup(
    author="Brainbot Labs Est.",
    author_email='contact@brainbot.li',
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'Intended Audience :: Developers',
        'Natural Language :: English',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.6',
    ],
    description="Metrics backend for the Raiden Network Explorer",
    entry_points={
        'console_scripts': [
            'metrics_backend=metrics_backend.metrics_cli:main',
        ],
    },
    install_requires=requirements,
    long_description='',
    include_package_data=True,
    keywords='metrics_backend',
    name='metrics_backend',
    packages=find_packages(include=['metrics_backend']),
    setup_requires=setup_requirements,
    test_suite='tests',
    tests_require=test_requirements,
    url='https://github.com/raiden-network/status-page',
    version='0.0.1',
    zip_safe=False,
)
