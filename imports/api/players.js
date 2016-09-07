import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

//define and export a Collection named "players"
export const Players = new Mongo.Collection('players');


if(Meteor.isServer) {

	Meteor.publish('players', function playersPublication(){

		// return all 4 players
		return Players.find({});
	});
}


Meteor.methods({

	//update score and turn off 'active' status
	'players.update'(id, new_score) {

		check(new_score, Number);
		Players.update({_id: id}, {$set: {score: new_score, active: false}});
	},

	//turn on another player's 'active status'
	'players.update-active' (id) {

		// revert back when it's the last player
		if(id === 4) id = 0;
		Players.update({_id: id + 1}, {$set: {active: true}});
	},

	//deactivate players to stop game
	'players.update-deactive' (id) {

		Players.update({_id: id}, {$set: {active: false}});
	},


});