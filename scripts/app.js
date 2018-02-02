//MIT License. (C) SoV VTrans, 8/2017, 
//Author: josiah.raiche@vermont.gov
//A dreamfactory-based CRUD application.
//tables must have an ID field named id.
//lookup tables must have an ID as the common key and Name for the name.

//requires jquery, datatables, and chosen.js

var Dreamer = function(api_key, token, base, endpoint, tableID) {
	var self = {
		api_key: api_key,
		instanceURL: base,
		endpoint:endpoint,
		filters: '',
		table: document.createElement('table'),
		template: {},
		token: '',
		tableID:  tableID || 'df_table',
		attachmentPoint: document.body,
		name: '',
		ready: false,
		
		/* ****
		Row operations
		*/
		add: function (data, notInitialized) {
			//adds a row to the current table using a template.
			var tr = this.build(data),
				self = this;
				
			if (typeof notInitialized === 'undefined' || !notInitialized) {
				$(this.table).DataTable().row.add($(tr)).invalidate().draw();
			} else { // when we first load stuff before initializing datatables.
				$('tbody', this.table).append(tr);
			}
			$('td div[contenteditable="true"], select', $(tr)).on('change, input', function (event) {self.updateModel.apply(self, [event, self])}); // attach handler
		},
		
		build: function(data) {
			var tr = document.createElement('tr'),
				self = this;
			data = data || {};
				
			$.each(self.template.order, function (i, key) {
				var point = data[key],
					cell = self.template.fields[key].template.cloneNode(true),
					cellDiv = document.createElement('div');
					
				cellDiv.className = 'long-wrapper';
					
				if (key === 'id') { // we're not showing ids, only buttons.
					var btn = document.createElement('button'),
						id = document.createElement('p');
					btn.className = 'btn btn-danger';
					btn.innerHTML = 'Remove';
					id.className="text-center col-id";
					id.innerHTML = point || '';
					$(btn).on("click", function (event) {self.remove.apply(self, [event])});
					cell.appendChild(btn);
					cell.appendChild(id);
					
				} else {
				
					if (point) {
						if ($('select', cell).length > 0) {
							$('select', cell).val(point);
						} else if (typeof point === "string") {
							cellDiv.innerHTML = point.replace(/&/g, '&amp;').replace(/</g, '&lt;');
						} else {
							cellDiv.innerHTML = point;
						}
					}
					
					if ($('select', cell).length > 0) { // if it's a select, use the text of the selection for searching, etc.
						var selectedVal = $("option:selected",$('select', cell)).text();
						$(cell).attr('data-type', key).attr('data-order', selectedVal).attr('data-search', selectedVal);
					} else { // otherwise use the datapoint
						cell.appendChild(cellDiv);
						cellDiv.contentEditable = true;
						$(cell).attr('data-type', key).attr('data-order', point).attr('data-search', point);
					}
				}
				
				$(tr).attr('data-' + key, data[key]);
				tr.appendChild(cell);
			});
			
			return tr;	
		},
		
		refresh: function (row, id) {
			//pulls new data for the row, mostly used to confirm successful entry
			var data = $(row).data() || {},
				self = this;
			
			if (id) {
				data.id = id;
			}
			
			self.getRecords("where=id=" + data.id, 
				function (response) {
					self.replace(response[0], row);
				}
			);
		},
		
		replace: function (data, row) {
			//destroy a row and add a new one with the data
			$(this.table).DataTable().row($(row)).remove();
			this.add(data); //todo, maybe this needs to be at a particular index somehow? Or sorting will automatically fix it.
		},
		
		remove: function (event) {
			var row = $(event.originalEvent.target).parents('tr')[0],
				data = $(row).data(),
				self = this;
			if (data.id === 'undefined') { //row was only added via UI, not to db
				$(self.table).DataTable().row($(row)).remove().draw();
			} else {
				this.deleteRecord("where=id=" + data.id, function(response) {
					$(self.table).DataTable().row($(row)).remove().draw();
				});
			}
		},
		
		
		updateModel: $.debounce(function (event, self) { // todo replace all updatecell with this.
			var event = event.originalEvent || event,
				target = event.target,
				tr = $(target).parents('tr')[0],
				type = $(target).attr('data-type') || $($(target).parents('td')[0]).attr('data-type'),
				newVal = '';
				
			if (target.nodeName === 'SELECT') {
				newVal = $(target).val();
				var selectedVal = $("option:selected",$(target)).text();
				$($(target).parents('td')[0]).attr('data-order', selectedVal).attr('data-search', selectedVal);
			} else {
				newVal = $(target).text();
				$($(target).parents('td')[0]).attr('data-order', newVal).attr('data-search', newVal);
			}	
			
			self.rowHeight($(tr));
			$(this.table).DataTable().row(tr).invalidate();
			
			$(tr).attr('data-'+type, newVal)
			$('button', tr).removeClass('btn-danger').addClass('btn-success').text('Update').off().on("click", 
				function (event) {
					self.submit.apply(self, [event])
				}
			);
		}, 300),
		
		
		/* ***
		Templatey stuff
		*/
		buildURL: function (endpoint) {
			var url = this.instanceURL + this.endpoint;
			
			if (url.lastIndexOf('/') === url.length) { //trim trailing slash.
				url = url.substring(0, url.length - 1);
			}
			
			return url.substring(0, url.lastIndexOf('/') + 1) + endpoint;	
		},

		createTemplate: function (schema) {
			var self = this;
			self.template.fields = {};
			self.template.order = [];
			
			$.each(schema.field, function (i, s) { //first, get a list of all the fields.
				// we do this first loop because we need to be able to check when all the fields are done from the
				// async callback that builds dropdowns.
				var field = {};
				self.template.fields[s.name] = field;
				self.template.order.push(s.name);
				
				field.label = s.label;
				field.pending = true;
			});
			
			$.each(schema.field, function (i, s) {
				var field = self.template.fields[s.name];
				
				if (s.ref_table) {
					//it's a foreign key, we need to lookup its values.
					var url = self.buildURL(s.ref_table)
					field.type = "choice";
					self.getRecords(url, false, 
						function (response) { 
							field.choices = response;
							self.createFieldTemplate(field);
						}
					);
				} else { // otherwise, just get build the field.
					field.type = s.type;
					self.createFieldTemplate(field);
				}
			});
		},
		
		createFieldTemplate: function (field) {
			field.template = document.createElement('td');
			
			if (field.type === 'choice') { //todo - validation functions for types should go here.
				var select = document.createElement('select');
				field.choices.unshift({id:'', name:''});
				$.each(field.choices, function (i, v) {
					var option = document.createElement('option');
					option.value = v.id;
					option.innerHTML = v.name;
					select.appendChild(option);
				});
				field.template.appendChild(select.cloneNode(true));
			}
			
			field.pending = false;
			
			//check if all fields done, then create the row template.
			var done = true;
			$.each(this.template.fields, function (k, v) {
				if (v.pending) {
					done = false;
					return false;
				}
			});
			
			if (done) {
				this.createTable();
			}
			
		},
		
		/* ***
		initial rendering of the table 
		*/

		createTable: function () {
			
			var head = document.createElement('thead'),
				headerRow = document.createElement('tr'),
				self = this;
				
			$.each(this.template.order, function (i, v) {
				var th = document.createElement('th');
				th.innerHTML = v.replace(/_/g, ' ');
				headerRow.appendChild(th);
			});
				
			head.appendChild(headerRow);
			this.table.appendChild(head);
			this.table.appendChild(document.createElement('tbody'));
			this.attachmentPoint.appendChild(this.table);
			this.table.id = this.tableID;
			this.table.className = 'table'; 

			//fill the table with results
			this.getRecords(false, 
				function (response) { //todo: pagination
					$.each(response, function (i, r) {
						self.add(r, true);
					});
					
					$(self.table).DataTable({
						dom: "<'row'<'col-sm-12 col-md-12 rowAdder text-center'>><'row'<'col-sm-12 col-md-4'l><'col-sm-12 col-md-4 addButtonPlace text-center'><'col-sm-12 col-md-4'f>><'row'<'col-sm-12'tr>><'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
						order: [[1, 'asc']],
						pageLength: 25,
						drawCallback: function () {
							$('tr select').chosen({disable_search_threshold: 10}); // have to be post-dom attachment
							$.debounce(function() {
								$('tr').each(function() {
									self.rowHeight(this);
								});
							}, 100)();
						}
					});
					$('.rowAdder', $(self.table).parents('.dataTables_wrapper')).append($('<h2>' + self.name + '</h2>'));
					$('.addButtonPlace', $(self.table).parents('.dataTables_wrapper')).append($('<button class="btn btn-info">Add Row</button>').click(function() {self.add.apply(self)}));
					$(self.table).DataTable().rows().invalidate().draw(); // to pickup data-order and data-search fields.
					self.ready = true;
				}
			);
		},
		
		submit: function (event){
			var row = $(event.originalEvent.target).parents('tr')[0],
				data = $(row).data(),
				self = this;
				
			data.last_update = new Date();

			if (data.id) {
				self.replaceRecord(JSON.stringify({"resource": [data]}), function(response) {
					self.refresh(row);
				});
			} else {
				self.setRecord(JSON.stringify({"resource": [data]}), function(response) {
					self.refresh(row, response[0].id); // pass along the id of the new record so we can go grab it.
				});
			}
		},
		
		
		rowHeight: function (row) {
			$('.long-wrapper', row).each(function() {
				$div = $(this); 
				$div.height($($div.parents('td')[0]).height())
			}); 
		},
		/* ***
		API Methods, from DF sample code
		*/
		
		APIError: function (response, ajax) {
			if (response.status == 401) {
				window.replay = ajax;
				$('#login').modal({backdrop:'static', keyboard:false});
			} else {
				console.trace();
				$('#failure').modal();
				$('#errorStatusCode').html(response.status);
				$('.error-img').attr('src', 'https://http.cat/' + response.status);
			}
			return false;
		},
		
		getRecords: function(params, callback) {
			if (arguments.length === 3) {
				url = arguments[0];
				params = arguments[1];
				callback = arguments[2];
			} else {
				url = this.instanceURL + this.endpoint
			}
			
			$.ajax({
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				url: url,
				data: params,
				cache:false,
				method:'GET',
				retries: 3,
				headers: {
					"X-DreamFactory-API-Key": this.api_key,
					"X-DreamFactory-Session-Token": this.token
				},
				success:function (response) {
					if(typeof callback !== 'undefined') {
						if (response.hasOwnProperty('resource'))
							callback(response.resource);
						else
							callback(response);
					}
				},
				error: function (response) {
					self.APIError(response, this);
				}
			});
		},
		
		getSchema: function(callback) {
			var url = this.instanceURL + this.endpoint.replace('_table', '_schema');
			if (arguments.length === 2) {
				url = arguments[0];
				callback = arguments[1];
			}
			$.ajax({
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				url: url,
				cache:false,
				method:'GET',
				retries: 3,
				headers: {
					"X-DreamFactory-API-Key": this.api_key,
					"X-DreamFactory-Session-Token": this.token
				},
				success: function (response) {
					if(typeof callback !== 'undefined') {
						if (response.hasOwnProperty('resource'))
							callback(response.resource);
						else
							callback(response);
					}
				},
				error: function (response) {
					self.APIError(response, this);
					console.log(url);
				}
			});
		},

		setRecord: function(params, callback) {
			$.ajax({
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				url: this.instanceURL + this.endpoint,
				data: params,
				cache:false,
				method:'POST',
				retries: 3,
				headers: {
					"X-DreamFactory-API-Key": this.api_key,
					"X-DreamFactory-Session-Token": this.token
				},
				success:function (response) {
					if(typeof callback !== 'undefined') {
						if (response.hasOwnProperty('resource'))
							callback(response.resource);
						else
							callback(response);
					}
				},
				error: function (response) {
					self.APIError(response, this);
				}
			});
		},

		updateRecord: function(params, callback) {
			$.ajax({
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				url: this.instanceURL + this.endpoint,
				data: params,
				cache:false,
				method:'PATCH',
				retries: 3,
				headers: {
					"X-DreamFactory-API-Key": this.api_key,
					"X-DreamFactory-Session-Token": this.token
				},
				success:function (response) {
					if(typeof callback !== 'undefined') {
						if (response.hasOwnProperty('resource'))
							callback(response.resource);
						else
							callback(response);
					}
				},
				error: function (response) {
					self.APIError(response, this);
				}
			});
		},

		deleteRecord: function(params, callback) {
			$.ajax({
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				url: this.instanceURL + this.endpoint + '?' + params,
				//data: params,
				cache:false,
				method:'DELETE',
				retries: 3,
				headers: {
					"X-DreamFactory-API-Key": this.api_key,
					"X-DreamFactory-Session-Token": this.token
				},
				success:function (response) {
					if(typeof callback !== 'undefined') {
						if (response.hasOwnProperty('resource'))
							callback(response.resource);
						else
							callback(response);
					}
				},
				error: function (response) {
					self.APIError(response, this);
				}
			});
		},

		replaceRecord: function(params, callback) {
			$.ajax({
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				url: this.instanceURL + this.endpoint,
				data: params,
				cache: false,
				method: 'PUT',
				retries: 3,
				headers: {
					"X-DreamFactory-API-Key": this.api_key,
					"X-DreamFactory-Session-Token": this.token
				},
				success: function (response) {
					if(typeof callback !== 'undefined') {
						if (response.hasOwnProperty('resource'))
							callback(response.resource);
						else
							callback(response);
					}
				},
				error: function (response) {
					self.APIError(response, this);
				}
			});
		}
		
	};
	
	//go get schema for that table
	self.token = token;
	self.getSchema(function(response) {
		self.name = response.label;
		self.createTemplate.apply(self, [response]);
	});
	
	return self;
};

//debouncer from underscore.js
(function($) {

    $.extend({
		debounce: function(func, wait, immediate) {
			var timeout;
			return function() {
				var context = this, args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		}

    });
	/* TODO: fix so it works in IE
	$.ajax = (($oldAjax) => {
		// on fail, retry by creating a new Ajax deferred
		// FROM https://stackoverflow.com/a/39812370/2661831
		function check(a,b,c){
			var shouldRetry = b != 'success' && b != 'parsererror';
			if( shouldRetry && --this.retries > 0 )
				setTimeout(() => { $.ajax(this) }, this.retryInterval || 100);
		}
		return settings => $oldAjax(settings).always(check)
	})($.ajax);
	*/
}(jQuery));


