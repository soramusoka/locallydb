/* global describe, xdescribe, it, xit, expect, beforeEach */

var LocallyDB = require('../src/db');
var db = new LocallyDB('./db');
db.removeCollection('unit-test.json');

describe('#collection', function () {
	var collection = db.collection('unit-test.json');

	describe('#get', function () {
		var id, incorrectId;

		beforeEach(function (done) {
			collection.insert({}, function (err, result) {
				id = result;
				done();
			});
		});
		it('should return default object', function (done) {
			collection.get(id, function (err, result) {
				expect(err).toBe(null);
				expect(result).toBeDefined();
				expect(result.cid).toBe(0);
				expect(result.$created).toBeDefined();
				expect(result.$updated).toBeDefined();
				done();
			});
		});
		it('should return error if ID doesnot exists', function (done) {
			collection.get(incorrectId, function (err, result) {
				expect(err).not.toBe(null);
				expect(result).toBe(null);
				done();
			});
		});
	});

	describe('#insert', function () {
		it('should insert object', function (done) {
			var obj = { value: 1 };
			collection.insert(obj, function (err, id) {
				expect(err).toBe(null);
				expect(id > 0).toBeTruthy();
				done();
			});
		});
	});

	describe('#update', function () {
		var id;

		beforeEach(function (done) {
			collection.insert({ original: 1 }, function (err, result) {
				id = result;
				done();
			});
		});

		it('should update object', function (done) {
			var obj = { value: 1 };

			collection.update(id, obj, function (err, result) {
				expect(err).toBe(null);
				expect(result).toBeTruthy();

				collection.get(id, function (err, result) {
					expect(err).toBe(null);
					expect(result.value).toBe(1);

					done();
				});
			});
		});

		it('should not replace original object', function (done) {
			var obj = { value: 1 };

			collection.update(id, obj, function (err, result) {
				expect(err).toBe(null);

				collection.get(id, function (err, result) {
					expect(err).toBe(null);
					expect(result.original).toBe(1);
					expect(result.value).toBe(1);
					done();
				});
			});
		});
	});

	describe('#replace', function () {
		var id;
		beforeEach(function (done) {
			collection.insert({ original: 1 }, function (err, result) {
				id = result;
				done();
			});
		});
		it('should replace object', function (done) {
			var obj = { value: 1 };
			collection.replace(id, obj, function (err, result) {
				expect(err).toBe(null);

				collection.get(id, function (err, result) {
					expect(err).toBe(null);
					expect(result.original).toBeUndefined();
					expect(result.value).toBe(1);

					done();
				});
			});
		});
	});

	describe('#remove', function () {
		var id;
		beforeEach(function (done) {
			collection.insert({ original: 1 }, function (err, result) {
				id = result;
				done();
			});
		});
		it('should remove object', function (done) {
			collection.remove(id, function (err, result) {
				expect(err).toBe(null);
				expect(result).toBeTruthy();

				collection.get(id, function (err, result) {
					expect(err).not.toBe(null);
					done();
				});
			});
		});
	});

	describe('#deleteProperty', function () {
		var id;
		beforeEach(function (done) {
			collection.insert({ original: 1 }, function (err, result) {
				id = result;
				done();
			});
		});
		it('should deleteProperty', function (done) {
			collection.deleteProperty(id, 'original', function (err, result) {
				expect(err).toBe(null);
				expect(result).toBeTruthy();

				collection.get(id, function (err, result) {
					expect(err).toBe(null);
					expect(result.original).toBeUndefined();
					done();
				});
			});
		});
		
		// TODO: fix logic
		xit('should not deleteProperty if property does not exists', function (done) {
			done();
		});
	});
	
	// TODO: Add tests for upsert
});