var schemaEndpoint, dataEndpoint;

$(document).ready(function() {
	schemaEndpoint = base + endpoint + '/_schema/' + urlParams.table;
	dataEndpoint   = base + endpoint + '/_table/' + urlParams.table + "?filter=id=" + urlParams.row;
});

function adlogin (username, password, callback) {
	$.ajax({
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		url: base + '/api/v2/user/session?service=aot-ad',
		data: JSON.stringify({
			"username": username,
			"password": password,
			"service": "aot-ad",
			"remember_me": true
		}),
		cache:false,
		method:'POST',
		success:function (response) {
			callback(response);
		},
		error:function (response) {
			callback(response);
			return false;
		}
	});
}

function getDF(url, params, callback) {
	$.ajax({
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		url: url,
		data: params,
		cache:false,
		method:'GET',
		headers: {
			"X-DreamFactory-API-Key": api_key,
			"X-DreamFactory-Session-Token": token
		},
		success:function (response) {
			if(typeof callback !== 'undefined') {
				callback(response);
			} else {
				callback(response);
			}
		},
		error:function (response) {
			callback(response);
			return false;
		}
	});
}

function setData(params, callback) {
	$.ajax({
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		url: dataEndpoint,
		data: params,
		cache:false,
		method:'PATCH',
		headers: {
			"X-DreamFactory-API-Key": api_key,
			"X-DreamFactory-Session-Token": token
		},
		success:function (response) {
			if(typeof callback !== 'undefined') {
				if (response.hasOwnProperty('resource'))
					callback(response.resource);
				else
					callback(response);
			}
		},
		error:function (response) {
			callback(response);
			return false;
		}
	});
}

function processSchema(response) {
	var r = response,
		t = $($('#inputTemplate').html()),
		p = $('#mainForm');
		
	$('#entryName').html(response.label);
	
	console.log(r);
	
	$.each(r.field, function(i, v) {
		if (v.name === 'last_update') return true; //skip last_update fields.
		
		var e = $(t.clone());
		
		$('label', e).text(v.label);
		
		switch (v.type) {
			case 'id': //don't show ID fields
			case 'pk':
			case 'user_id_on_create': //skip the hidden userID fields.
			case 'user_id_on_update':
			case 'timestamp_on_create': // and skip hidden timestamps.
			case 'timestamp_on_update':
				return true;
				break;
			case 'integer':
				$('input', e)[0].type = 'number';
				$('input', e)[0].step = 1;
				break;
			case 'float':
			case 'double':
			case 'decimal':
				$('input', e)[0].type = 'number';
				break;
			case 'boolean':
			case 'binary': //going to store these two as selects with a T/F option.
				$('input', e).replaceWith('<select class="form-control"><option value="true">True</option><option value="false">False</option></select>');
				break;
			case 'string':
				$('input', e)[0].type = 'text';
				$('input', e)[0].maxLength = v.length || 255;
				break;
			case 'text':
				$('input', e).replaceWith('<textarea class="form-control"></textarea>');
				break;
			case 'datetime':
			case 'timestamp':
				$('input', e)[0].type = 'datetime-local';
				break;
			case 'date':
				$('input', e)[0].type = 'date';
				break;
			case 'time':
				$('input', e)[0].type = 'time';
				break;
			case 'reference':
				$('input', e).replaceWith('<select class="form-control"></select>');
				getDF(base + endpoint + '/_table/' + v.ref_table, null, function(o) {
					console.log(o);
					$.each(o.resource, function (j, option) {
						$('.form-control', e).append('<option value="' + option.id + '">' + option.name + '</option>');
					});
					$('select', e).chosen({disable_search_threshold: 5});
				});
				break;
			//userID - consider doing this.
			
		}
		
		$('input, select, textarea', e)[0].id = "field" + v.name;
		$('input, select, textarea', e)[0].className += " formField";
		$('input, select, textarea', e).attr('name', v.name);
		$('input, select, textarea', e)[0].required = v.required;
		
		if (v.default) {
			$('input, select, textarea', e).val(v.default);
		}
		
		$(p).append(e);
	});
	getCurrentValues(); //todo wrap this in logic and remove to kickoff function.
}

function getCurrentValues() {
	getDF(dataEndpoint, null, function(response) {
		console.log(response);
		$.each(response.resource[0], function(k, v) {
			$('#field' + k).val(v).change();
		});
		$('select').trigger("chosen:updated");
	});
	
}

function submit() {
	//collect values
	//validate
		// error
	//submit
	var data = {};
	$('.formField').each(function (i, e) {
		data[$(e).attr('name')] = $(e).val();
	});
	
	var m = new moment(); 
	data.last_update = m.format('YYYY-MM-DD'); //todo time???
	
	setData(JSON.stringify({"resource": [data]}), function(r) {
		$('#submit').html('✔ Submitted').attr('disabled', 'disabled');
	});
}
