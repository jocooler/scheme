var schemaEndpoint, dataEndpoint;
$(document).ready(function() {
	schemaEndpoint = endpoint + '/_schema/' + urlParams.table;
	dataEndpoint   = endpoint + '/_data/' + urlParams.table + "?filter=where id=" + urlParams.row;
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
		retries: 3,
		success:function (response) {
			callback(response);
		},
		error:function (response) {
			callback(response);
			return false;
		}
	});
}
function init(params, callback) {
	var url = arguments[2] || base + schemaEndpoint;
	$.ajax({
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		url: url,
		data: params,
		cache:false,
		method:'GET',
		retries: 3,
		headers: {
			"X-DreamFactory-API-Key": api_key,
			"X-DreamFactory-Session-Token": token
		},
		success:function (response) {
			console.log(response);
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

function getData(params, callback) {
	var url = arguments[2] || base + dataEndpoint
	$.ajax({
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		url: url,
		data: params,
		cache:false,
		method:'GET',
		retries: 3,
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

function setData(params, callback) {
	$.ajax({
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		url: base + dataEndpoint,
		data: params,
		cache:false,
		method:'POST',
		retries: 3,
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
