import { Meteor} from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';

import { Players } from '../api/players.js'; // load Players collection

import './body.html';
import './player.html';
import './map.html';


// initialize sessional variable
Session.setDefault("moves", 0);
Session.setDefault("who", "Who");
Session.setDefault("winner", "null");
Session.setDefault("winner", false);

Session.setDefault("p1_score", 0);
Session.setDefault("p2_score", 0);
Session.setDefault("p3_score", 0);
Session.setDefault("p4_score", 0);

Session.setDefault("p1Background", "");
Session.setDefault("p2Background", "");
Session.setDefault("p3Background", "");
Session.setDefault("p4Background", "");


var number_of_player = 4;
var scores = new Array(number_of_player);

scores = [Session.get("p1_score"), Session.get("p2_score"), Session.get("p3_score"), Session.get("p4_score")];
//console.log(scores);

//initialize all grids with position and values
var grids = new Array(100);
for(i = 0; i < grids.length; i ++) {
	grids[i] = {
		position: i + 1,
		value: i + 1,
	};
}


//ladders defined in terms of position on map
var two_step_ladder = [3, 24, 39, 46, 51, 62, 95];
var three_step_ladder = [9, 33, 67, 80, 91];
var four_step_ladder = [37, 44, 57, 86];
var giant_ladder = [7, 16, 27];
var index = 0;

// add another key into the object
for(i = 0; i < two_step_ladder.length; i ++) {

	grids[two_step_ladder[i] - 1].isTwoLadder = true;
	grids[two_step_ladder[i] - 1].value += 2;
}

for(i = 0; i < three_step_ladder.length; i ++) {

	grids[three_step_ladder[i] - 1].isThreeLadder = true;
	grids[three_step_ladder[i] - 1].value += 3;
}

for(i = 0; i < four_step_ladder.length; i ++) {

	grids[four_step_ladder[i] - 1].isFourLadder = true;
	grids[four_step_ladder[i] - 1].value += 5;
}

for(i = 0; i < giant_ladder.length; i ++) {

	grids[giant_ladder[i] - 1].isGiantLadder = true;
	grids[giant_ladder[i] - 1].value += grids[giant_ladder[i] - 1].position;

}

//snakes
var two_step_snake = [4, 13, 30, 47, 54, 75, 92];
var three_step_snake = [20, 21, 31, 42, 68, 78];
var four_step_snake = [10, 55, 83, 93];
var giant_snake = [49, 99];

for(i = 0; i < two_step_snake.length; i ++) {

	grids[two_step_snake[i] - 1].isTwoSnake = true;
	grids[two_step_snake[i] - 1].value -= 2;

}

for(i = 0; i < three_step_snake.length; i ++) {

	grids[three_step_snake[i] - 1].isThreeSnake = true;
	grids[three_step_snake[i] - 1].value -= 3;

}

for(i = 0; i < four_step_snake.length; i ++) {

	grids[four_step_snake[i] - 1].isFourSnake = true;
	grids[four_step_snake[i] - 1].value -= 4;

}

for(i = 0; i < giant_snake.length; i ++) {

	grids[giant_snake[i] - 1].isGiantSnake = true;
	grids[giant_snake[i] - 1].value = 0;
}

//initialization
Template.body.onCreated(function bodyOnCreated() {
	//subscribe to server's publication
	Meteor.subscribe('players');

	//initialize all scores to be zero 
	for (i = 1; i <= number_of_player; i ++) {
		Meteor.call('players.update', i, 0);
		Meteor.call('players.update-deactive', i);
	}

	//randomly assign the first turn
	var first_turn = Random.choice([1, 2, 3, 4]);
	Meteor.call('players.update-active', first_turn);

});

Template.body.helpers({

	//return all players
	players() {
		return Players.find({});
	},

	//return the number of moves for each roll
	move() {
		return Session.get("moves");
	},

	//return true if a move is greater than 1
	moveIsOne() {
		return Session.get("moves") > 1;
	},

	//return who's turn
	who() {
		return Session.get("who");
	},

	//return winner's name
	winner () {
		return Session.get("winner");
	},

	//return whether there is a winner 
	hasWinner (){
		return Session.get("has-winner");
	},


});


Template.body.events({

	'click .roll-die'() {

		//generate a random score ranging from 1 - 6
		var ran = Random.choice([1, 2, 3, 4, 5, 6]);
		//final score to be updated in database
		var s = this.score + ran;//initial

		console.log( this.name + " Rolled: " + ran.toString());

		//var p_back = "p" + this._id.toString() + "Background";
		//find current active user name
		Session.set("who", this.name);
		Session.set("moves", ran);

		//console.log("p_back " + p_back);
		//Session.set(p_back, this.background);
		//console.log(p_back+ " " + this.name + " " + this.background);

		//check if any winner 
		if (this.score + ran < 100) { // no winner

			//check if identical score exists
			//if so, minus 1
			scores = [Session.get("p1_score"), Session.get("p2_score"), Session.get("p3_score"), Session.get("p4_score")];
			console.log("Before session update: " + scores);
			
			//s = grids[ this.score + ran - 1].value; // initial score + rolled number
			console.log( "Initial score + newly rolled dice: " + s.toString());
			console.log(scores.indexOf(s));// return -1 if not contained in existing scores

			//loop: active users -1 if got identical scores
			while (scores.indexOf(s) !== -1) {
				s --;
				console.log("Identical score, minus 1 score for active player.");
			}

			//possible to reach -1 score; handle negativity exception
			if(s < 0) {
				s = 0;
			} // back to start point

			//recursively check if step on any snake or ladder
			console.log("grids[48].position = " + grids[48].position);
			console.log("grids[48].value = " + grids[48].value);
			console.log("before snake and ladder check: s = " + s.toString());
			if (s !== 0) {
				while(grids[s - 1].position !== grids[s - 1].value) {
					s = grids[s - 1].value; // update final score as snake/ladder value
					//msg on if stand on snae or ladder
					console.log("Stand on Snake/Ladder");

					//check if identica scores

					scores = [Session.get("p1_score"), Session.get("p2_score"), Session.get("p3_score"), Session.get("p4_score")];
					while (scores.indexOf(s) !== -1) {
						s --;
						console.log("Identical score, minus 1 score for active player.");
					}
					if (s < 0) s = 0; // handle negative exception
				}
			}

			console.log("after snake and ladder check: s = " + s.toString());


			//update session array
			Session.set( "p" + this._id.toString() + "_score" ,s);

			scores = [Session.get("p1_score"), Session.get("p2_score"), Session.get("p3_score"), Session.get("p4_score")];
			console.log("After session update: " + scores + "\n");

			//update score
			Meteor.call('players.update', this._id, s);// s is new score
			

			//update a new attribute to grids[i]
			//if s === 0?
			//if (s !== 0)
			//	grids[s - 1].p_back = this.background;

			//turn on another user's 'active'
			Meteor.call('players.update-active', this._id);







		} else { //has a winner
			//set winner's name
			Session.set("winner", this.name);
			//update winner's status
			Session.set("has-winner", true);
			//update winner's score
			Meteor.call('players.update', this._id, 100);

			//de-active all players
			Meteor.call('players.update-deactive', this._id);
		}

	},

});

Template.map_row_one.helpers({

	grid(){
		var grids_row_one = new Array(20);

		for (i = 0; i < grids_row_one.length; i ++) 
			grids_row_one[i] = grids[i];

		return grids_row_one; 
	},

}); 

Template.map_row_two.helpers({

	grid(){
		var grids_row_two = new Array(20);

		for (i = 0; i < grids_row_two.length; i ++) 
			grids_row_two[i] = grids[20 + i];

		return grids_row_two; 
	},

}); 

Template.map_row_three.helpers({

	grid(){
		var grids_row_three = new Array(20);

		for (i = 0; i < grids_row_three.length; i ++) 
			grids_row_three[i] = grids[40 + i];

		return grids_row_three; 
	},

});


Template.map_row_four.helpers({

	grid(){
		var grids_row_four = new Array(20);

		for (i = 0; i < grids_row_four.length; i ++) 
			grids_row_four[i] = grids[60 + i];

		return grids_row_four; 
	},

});


Template.map_row_five.helpers({

	grid(){
		var grids_row_five = new Array(20);

		for (i = 0; i < grids_row_five.length; i ++) 
			grids_row_five[i] = grids[80 + i];

		return grids_row_five; 
	},

});


