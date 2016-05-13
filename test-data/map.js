function map_datafield_occurrence() { 
    for(var i in this.field_counts) {     
         emit(this.field_counts[i].name, 1); 
    }
}

function reduce_datafield_occurrence(field_name, records) {
      return Array.sum(records);
}

db.records.mapReduce(map_datafield_occurrence, reduce_datafield_occurrence,{out:"mr_datafield_occurrence"};

function map_datafield_counts() { 
    for(var i in this.field_counts) {     
         emit(this.field_counts[i].name, this.field_counts[i].count); 
    } }

function reduce_datafield_counts(field_name, counts) {
      return Array.sum(counts);
}

db.records.mapReduce(map_datafield_counts,reduce_datafield_counts,{out:"mr_datafield_counts"});

function map_subfield_occurrence() { 
    for(var i in this.field_counts) {
	  for(var j in this.field_counts[i].subfields) {     
         emit(this.field_counts[i].name + '_' + this.field_counts[i].subfields[j].name, 1); 
	  }
    }
}

function reduce_subfield_occurrence(key, records) {
      return Array.sum(records);
}

db.records.mapReduce(map_subfield_occurrence, reduce_subfield_occurrence,{out:"mr_subfield_occurrence"});

function map_subfield_counts() { 
    for(var i in this.field_counts) {
	  for(var j in this.field_counts[i].subfields) {     
         emit(this.field_counts[i].name + '_' + this.field_counts[i].subfields[j].name, this.field_counts[i].subfields[j].count); 
	  }
    }
}

function reduce_subfield_counts(key, count) {
      return Array.sum(count);
}

db.records.mapReduce(map_subfield_counts, reduce_subfield_counts,{out:"mr_subfield_counts"});

function map_value_counts() { 
    for(var i in this.data) {
	    for(var j in this.data[i].subfields) {
			if(this.data[i].subfields[j] != null && this.data[i].subfields[j].value != null) {
				var substr = this.data[i].subfields[j].value.substring(0, 100);
				emit({ "field" : this.data[i].name + '_' + this.data[i].subfields[j].name,
					"value" : substr }, 1);
			}
		}
    }
}

function reduce_value_counts(key, count) {
      return Array.sum(count);
}

db.records.mapReduce(map_value_counts, reduce_value_counts,{out:"mr_value_counts"});


