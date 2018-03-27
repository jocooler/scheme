Scheme
==========

Scheme is a tool for building generic data management applications from DreamFactory REST API endpoints. For more information about DreamFactory, [visit their docs.](http://wiki.dreamfactory.com/Main_Page).

How Scheme fits:
-------------------

A conventional web application is built in layers:

* HTML/JS front end 
* Middleware (authentication, functionality)
* Backend (servers, databases, etc).

A challenge has always been the time it takes to build all of these layers for every application. DreamFactory offers a generic middleware solution, handling data presentation and user authentication via REST APIs. Since DreamFactory exposes every database in a similar way, it's possible to read those schema and generate generic User Interfaces from the REST API endpoints.

In the Scheme ecosystem the stack looks like this:

* Scheme (Generic data management front-end)
* DreamFactory (Generic middleware)
* Data Structure (Database)

Data Structure Requirements
--------------------------

All tables must have a primary key (auto increment) of `id` and a `name` column to be used in dropdowns in related tables. In DreamFactory, at least an App and a Role will need to be configured to allow access to the data.

Scheme's structure
----------------------

Scheme is built as a package of html+js+css files that can be deployed on a server or to client machines. No special server is necessary; all processing happens on the client. To get started:

1. Clone the repo
2. Edit `scripts/connection.js` to point to your DreamFactory instance.

To manipulate the data calling `index.html#table_name` will generate an interface for the entire table. To work on a single row, use `item.html?table=table_name&row=id` to generate a single row entry form.

Once you're ready to start customizing the interface, putting an html file with the name of the table into the `/content` folder will cause Scheme to use that custom form instead of the generic interface. You can still call `item.html?table=table_name&row=id` as the URL and scheme will handle the redirection.

Schema-driven development
-------------------------

The idea of Schema-driven development is to enable extreme flexibility of the data model during early stages of application development. Rather than needing to update the UI each time the data structure changes, by using a generated UI a simple cache clear in DreamFactory makes the change visible to all clients.

Where customization is needed, the generic forms can be used as a template, then saved in the `/content/` folder to enable rapid development.

**For Application Development**

Begin with a data schema (note: Scheme:EAV would allow for a [generic data structure](https://en.wikipedia.org/wiki/Entity%E2%80%93attribute%E2%80%93value_model). This fork remains vaporware). Ensure that it meets the business needs of the users. Then pilot more advanced functionality where/as needed using custom forms.

**For Procurement**

A sample application could be built quickly to get an idea of additional business requirements that may not be immediately apparent.

Current Work
--------------

* Row-based security model
* More documentation for building custom forms
* Performance enhancements 
	* cache schema and use a build script
	* allow for paged data loads
	* DataTables.js configuration/optimization
* Allowing custom table files 
* Better UI/reference implementations for crosswalk tables






