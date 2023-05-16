$(document).ready(function(){

    $('#menu').click(function(){
      $(this).toggleClass('fa-times');
      $('header').toggleClass('toggle');
    });
  
    $(window).on('scroll load',function(){
  
      $('#menu').removeClass('fa-times');
      $('header').removeClass('toggle');
  
      if($(window).scrollTop() > 0){
        $('.top').show();
      }else{
        $('.top').hide();
      }
  
    });
  
    // smooth scrolling 
  
    $('a[href*="#"]').on('click',function(e){
  
        e.preventDefault();
    
        $('html, body').animate({
    
          scrollTop : $($(this).attr('href')).offset().top,
    
        },
          500, 
          'linear'
        );
    
      });
    
    });
function sendMail() {
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let phoneNo = document.getElementById("phone").value;
    let message = document.getElementById("message").value;
    let emailBody = "Name : " +name+ "<br/>Email : " +email+ "<br/>Phone Number : " +phoneNo+ "<br/>Message : "+message;

    Email.send({
        SecureToken : "3382b6be-dd99-4f10-b36c-43a74d7fe54e",
        To: 'meghrajgupta58@outlook.com',
        From: "meghrajgupta58@outlook.com",
        Subject: "Contact Message from "+name,
        Body: emailBody
    }).then(
        message => alert(message)
    );
}
