var request = require('supertest'),
    expect  = require('expect.js'),
    express = require('express');

var app = require('../app.js');

var mongoose = require('mongoose'),
    Application = mongoose.model('Application');

describe('admin api', function(){

  it('get applications',function(done){
    request(app)
        .get('/admin/application')
        .expect(200, done);
  });


  describe('create application',function(){
    after(function(){
      Application.collection.remove(function(err){

      });
    });

    it('fail without name',function(done){
      request(app)
        .post('/admin/application')
        .send({"secret": "123"})
        .expect(400)
        .expect("name is required",done);
    });

    it('fail without secret',function(done){
      request(app)
        .post('/admin/application')
        .send({"name": "new name"})
        .expect(400)
        .expect("secret is required",done);
    });

    it('create with valid name and secret',function(done){
      var expectedJson={
        "name": "new name",
        "active": true,
        "send": {
           "limit": 200000,
           "count": 0
        }
      };
      request(app)
        .post('/admin/application')
        .send({"name": "new name","secret": "123"})
        .expect(201)
        .expect(JSON.stringify(expectedJson),done);
    });

    it('validate that the name of the application is unique', function(done){
      application = new Application({name: "Unique Name", secret: "Secret", active: true, send: {limit: 2000, count: 0}});
      application.save(function(err){
        expect(err).to.be(null);
        request(app)
          .post('/admin/application')
          .send({"name": "Unique Name","secret": "Secret"})
          .expect(400)
          .expect("Application with name 'Unique Name' already exists.",done);
      });
    });
  });
});
