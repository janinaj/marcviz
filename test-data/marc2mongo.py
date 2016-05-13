import xml.etree.ElementTree as ET
import json
from pymongo import MongoClient

if __name__ == "__main__":
  root = ET.parse('UIU_1_subset.xml')
  namespace = {'marc': 'http://www.loc.gov/MARC21/slim'}

  client = MongoClient()
  db = client.marc

  for marcrecord in root.findall('.//marc:record', namespace):
    record = {}
    record['data'] = []
    record['field_counts'] = []
    
    field_counts = {}
    for datafield in marcrecord.findall('marc:datafield', namespace):
      # assume there is always a tag
      if 'tag' in datafield.attrib and datafield.attrib['tag'].strip():
        datafield_tag = datafield.attrib['tag'].strip()
        
        if datafield_tag not in field_counts:
          field_counts[datafield_tag] = { 'count' : 0 , 'subfields' : {} }
        field_counts[datafield_tag]['count'] += 1

        record_data = {}
        record_data['name'] = datafield_tag

        subfields = datafield.findall('marc:subfield', namespace)
        if len(subfields) == 0:
          record['value'] = datafield.text
        else:
          subfields =  []

          if 'ind1' in datafield.attrib and datafield.attrib['ind1'].strip():
            record_data['ind1'] = datafield.attrib['ind1'].strip()

          if 'ind2' in datafield.attrib and datafield.attrib['ind2'].strip():
            record_data['ind2'] = datafield.attrib['ind2'].strip()

          for subfield in datafield.findall('marc:subfield', namespace):
              if 'code' in subfield.attrib and subfield.attrib['code'].strip():
                subfield_code = subfield.attrib['code'].strip()
                subfields.append( { "name" : subfield_code, "value" : subfield.text } )

                if subfield_code not in field_counts[datafield_tag]['subfields']:
                  field_counts[datafield_tag]['subfields'][subfield_code] = 0
                field_counts[datafield_tag]['subfields'][subfield_code] += 1
          record_data['subfields'] = subfields

          record['data'].append(record_data)

    for datafield, value in field_counts.iteritems():
      subfield_counts = []
      for subfield_name, subfield_count in value['subfields'].iteritems():
       subfield_counts.append( { 'name' : subfield_name, 'count' : subfield_count })
      record['field_counts'].append({ 'name' : datafield, 'count' : value['count'], 'subfields' : subfield_counts })
    db.records.insert_one(record)