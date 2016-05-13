import csv
import os
import json
#import itertools

def main():
  with open('marc.csv', 'rU') as csvfile:
    reader = csv.DictReader(csvfile)
    datafields = {}
    ind1 = {}
    ind2 = {}
    subfields = {}
    current_datafield = {}

    for row in reader:
      if (row['Datafield'] != ''):
        if current_datafield:
          datafields[current_datafield['Datafield']] = {}
          datafields[current_datafield['Datafield']]['description'] = current_datafield['Datafield Description']
          datafields[current_datafield['Datafield']]['subfields'] = subfields
          subfields = {}

          datafields[current_datafield['Datafield']]['ind1'] = ind1
          ind1 = {}

          datafields[current_datafield['Datafield']]['ind2'] = ind1
          ind2 = {}
        current_datafield = row
      if(row['Indicator Tag'] != ''):
        if row['Indicator Tag'] == '1':
          ind1[row['Indicator Value']] = row['Indicator Description']
        elif row['Indicator Tag'] == '2':
          ind2[row['Indicator Value']] = row['Indicator Description']
      if(row['Subfield'] != ''):
        subfields[row['Subfield']] = row['Subfield Description']
    print json.dumps(datafields, ensure_ascii=False)

if __name__ == "__main__":
  main()