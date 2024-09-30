# Makefile for Flask KMeans Clustering App

# Python version
PYTHON = python3

# Virtual environment
VENV = venv
VENV_ACTIVATE = $(VENV)/bin/activate

# Install dependencies
install:
	$(PYTHON) -m venv $(VENV)
	# Activate virtual environment and install dependencies
	. $(VENV_ACTIVATE) && pip install -r requirements.txt

# Run the application
run: install
	# Activate virtual environment and run the Flask application
	. $(VENV_ACTIVATE) && $(PYTHON) -m flask run --port=3000

