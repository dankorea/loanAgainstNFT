## setup venv

need to use python3.9

run in cmd: `python3.9 -m venv .venv`

or use vscode cmd+shift+p `python:create enviroment`

## install dependence

active py venv

`source /Users/qxc/projects/loanAgainstNFT/.venv/bin/activate` or use vscode functions.

then

`pip install eth-brownie`

> ps: if install failed. clean venv `python -m venv --clear .venv` then install brownie again.

## how to compile

`brownie compile` will generate directory /build and /reports

contracts api json file is in the path `/build/contracts/**.json`
