rp({
    uri: 'https://api.github.com/orgs/IBM/repos',
    
    headers: {
        'User-Agent': 'simple_rest_app'
    },
    qs: {
    //  q: user,
      client_id: credentials.GIT_CLIENT_ID,
      client_secret : credentials.GIT_CLIENT_SECRET
    },
    json: true
  })
    .then((data) => {
      response.send(data)
      //response.render('/index.html')
    })
    .catch((err) => {
      console.log(err)
      response.render('error')
})