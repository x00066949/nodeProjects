$(document).ready(function(){
	$('#searchIssue').on('keyup',function(eventIn){
		let issueNumber = eventIn.target.value;

		//request to github api using ajax
		//send api url + data (clientID and client secret)- sending this data allows for more api calls to github api
		//the data portion ca be generated from github oauth
		$.ajax({
			url:'https://api.github.com/search/issues?q='+issueNumber,
			data:{
				client_id:'f9d840a9b3f8401549b8',
				client_secret:'5f5dd5785bf5c394c61a5e1cd2555e07d467465f'
			}
			//ajax function returns promise so .done(*call-back fuction*) collects the response
			//it collects the response of the request we sent. ie. issues matching the id
		}).done(function(issue){
			$('#ticket').html(`
			${issue.total_count}
			`);
		}); 
		
	});
});