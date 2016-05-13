import os
import re
from datetime import datetime
from flask import Flask, request, flash, url_for, redirect, \
     render_template, abort, send_from_directory
from flask.ext.pymongo import PyMongo
from bson.json_util import dumps

app = Flask(__name__, static_url_path='/static')
app.config.from_pyfile('flaskapp.cfg')

app.config['MARC_DBNAME'] = 'marc'
mongo = PyMongo(app, config_prefix='MARC')

@app.route('/')
def index():
  return render_template('index.html')

##### DATA #####
@app.route("/datafield/record_occurrence")
def datafield_occurrence():
  datafield_occurrence = mongo.db.mr_datafield_occurrence.find({})
  return dumps(datafield_occurrence)

@app.route("/datafield/total_count")
def datafield_count():
  datafield_count = mongo.db.mr_datafield_counts.find({})
  return dumps(datafield_count)

@app.route("/subfield/record_occurrence/<subfield>")
def subfield_occurrence(subfield):
  subfield_occurrence = mongo.db.mr_subfield_occurrence.find({'_id' : {'$regex': r'^' + subfield + "_.*"} })
  return dumps(subfield_occurrence)

@app.route("/subfield/total_count/<subfield>")
def subfield_count(subfield):
  subfield_count = mongo.db.mr_subfield_counts.find({'_id' : {'$regex': r'^' + subfield + '_.*' } })
  return dumps(subfield_count)

@app.route("/value/total_count/<subfield>")
def value_count(subfield):
  cursor = mongo.db.mr_value_counts.find({ '_id.field' : subfield })
  value_count = []
  for doc in cursor:
    value_count.append({ '_id' : doc['_id']['value'], 'value' : doc['value']})
  
  return dumps(value_count)

@app.route("/value/regex_count/<subfield>/<regex>")
def regex_count(subfield, regex):
  regex_aggregate = mongo.db.mr_value_counts.aggregate([
    {"$match" : { 
        "_id.field": subfield,
        "_id.value" : {'$regex': regex }
      } 
    },
    { "$group" :
      { 
        "_id" : "null", 
        "total" : { 
            "$sum" : "$value" 
        } 
      } 
    }
  ])
  #regex_count = mongo.db.records.find({
  #      "data": { 
  #          "$elemMatch": {
  #              "name": "041",
  #              "subfields": {
  #                  "$elemMatch": {
  #                      "name": "a",
  #                      "value": {'$regex': regex }
  #                  }
  #              }
  #          }
  #      }
  #  }).count()

  for result in regex_aggregate:
    regex_count = result['total'];

  total_aggregate = mongo.db.mr_value_counts.aggregate([
    { "$match" : { "_id.field": subfield } },
      { "$group" :
        { 
          "_id" : "null", 
          "total" : { 
              "$sum" : "$value" 
          } 
        } 
      }
    ])

  for result in total_aggregate:
    total_count = result['total'];

  return dumps([{ '_id' : 'match', 'value' : regex_count },
    { '_id' : 'no match', 'value' : total_count - regex_count }])


@app.route("/value/regex_value/<subfield>/<match>/<regex>")
def regex_value(subfield, match, regex):
  if match == 'true':
    cursor = mongo.db.mr_value_counts.find({
        '_id.field': subfield,
        '_id.value': { '$regex' : regex }
      })
  else:
    cursor = mongo.db.mr_value_counts.find({
          '_id.field': subfield,
          '_id.value': { '$not' : re.compile(regex) }
        })


  value_count = []
  for doc in cursor:
    value_count.append({ '_id' : doc['_id']['value'], 'value' : doc['value']})
  
  return dumps(value_count)
  


@app.route('/<path:resource>')
def serveStaticResource(resource):
    return send_from_directory('static/', resource)

if __name__ == '__main__':
    app.debug = True
    app.run()
