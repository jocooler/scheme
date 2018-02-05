var schemaEndpoint, dataEndpoint;

$(document).ready(function() {
	schemaEndpoint = base + endpoint + '/_schema/' + urlParams.table;
	dataEndpoint   = base + endpoint + '/_data/' + urlParams.table + "?filter=where id=" + urlParams.row;
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
		url: base + dataEndpoint,
		data: params,
		cache:false,
		method:'POST',
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
	
	console.log(r);
	
	$.each(r.field, function(i, v) {
		var e = $(t.clone());
		
		$('label', e).text(v.label);
		
		switch (v.type) {
			case 'id':
				$('input', e)[0].type = 'number';
				break;
			case 'string':
				$('input', e)[0].type = 'text';
				$('input', e)[0].maxLength = 255;
				break;
			case 'text':
				$('input', e).replaceWith('<textarea class="form-control"></textarea>');
		}
		
		$(p).append(e);
	});
}

function submit() {
	//collect values
	//validate
		// error
	//submit
	var data = {date:date.format('YYYY-MM-DD'), measure: measure.id, status:story, target:target || 0, value: value};
	setData(JSON.stringify({"resource": [data]}), function(r) {
		$('#submit').html('✔ Submitted').attr('disabled', 'disabled');
	});
}
