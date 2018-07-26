"""
XLS -> json converter

Dependencies:
  $ pip install xlrd
  $ pip install simplejson

Move excel sheet to same page as this file's directory

Run
  $ python xls_to_json.py <excel sheet name here>
      - eg:  $ python xls_to_json.py Restourant.xlsx
Results will be dumped into gameStates.json in current directory
"""

import xlrd
import sys
from collections import OrderedDict
import simplejson as json

# Open the workbook and select the first worksheet
# wb = xlrd.open_workbook('Restourant.xlsx')    # Hardcoded
wb = xlrd.open_workbook(sys.argv[1])      # Pass in excel sheet name as first argument
sh = wb.sheet_by_index(0)                 # Assume data is on Sheet1

# Final json Product
gameStates = OrderedDict()
gameStates["Comment"] = "DTML Restaurant Simulator"
gameStates["StartAt"] = "Welcome"     #Scene 1

# Nested json mapping each scene to its contents
statejson = OrderedDict()     #OrderedDict keeps keys in the same order they are added

# Iterate through each row in worksheet and fetch values into dictionary
rownum = 1
totalrows = sh.nrows

while rownum < totalrows:
  # Get values in current row
  row_values = sh.row_values(rownum)

  # "Waiter text" indicates start of scene
  if row_values[0] == "Waiter text":
    rownum += 1
    row_values = sh.row_values(rownum)

    scene = OrderedDict()
    solutions = OrderedDict()
    answerwords = []

    scene['Type'] = 'Conversation'
    scene['Question'] = row_values[0]
    scene['AnswerWords'] = answerwords
    scene['Solutions'] = solutions

    statejson[row_values[2]] = scene

    rownum += 1
    while row_values[0] != "Waiter text" and rownum < totalrows:
      row_values = sh.row_values(rownum)

      answerword = row_values[3]
      if (answerword):     # if entry is not empty
        answerwords.append(answerword) 

      solution = row_values[4]
      score = row_values[5]
      next_scene = row_values[6]
      if (len(row_values) > 6 and solution and score and next_scene):   # if entries are not empty
        solutions[solution.lower()] = OrderedDict([("Score", score), ("Next", next_scene)])
      rownum += 1
    solutions["default"] = OrderedDict([("Score", -50), ("Next", None)])
  else:
    rownum += 1

gameStates["States"] = statejson

# Serialize the dictionary to JSON
j = json.dumps(gameStates)

# Write to file
with open('gameStates.json', 'w') as f:
    f.write(j)