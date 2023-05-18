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
<script>
    function sendMail() {
    let name = document.getElementById("txt").value;
    let email = document.getElementById("eml").value;
    let project = document.getElementById("txt1").value;
    let message = document.getElementById("txtarea").value;
    let emailBody = "Name : " +name+ "<br/>Email : " +email+ "<br/>Project : " +project+ "<br/>Message : "+message;

    Email.send({
        // Host : "smtp.elasticemail.com",
        // Username : "meghrajgupta58@outlook.com",
        // Password : "D599914A29A6AD9DFA03AFD357258C7FFDC9",
        SecureToken : "45a50538-202f-47d7-9109-d7256a8f67d6",
        To: 'meghrajgupta58@outlook.com',
        From: "meghrajgupta58@outlook.com",
        Subject: "Contact Message from "+name,
        Body: emailBody
    }).then(
        message => alert(message)
    );
}
</script>
// function sendMail() {
//     let name = document.getElementById("txt").value;
//     let email = document.getElementById("eml").value;
//     let project = document.getElementById("txt1").value;
//     let message = document.getElementById("txtarea").value;
//     let emailBody = "Name : " +name+ "<br/>Email : " +email+ "<br/>Project : " +project+ "<br/>Message : "+message;

//     Email.send({
//         SecureToken : "348f34f8-3669-4847-aef9-03317c808489",
//         To: 'meghrajgupta58@outlook.com',
//         From: "meghrajgupta58@outlook.com",
//         Subject: "Contact Message from "+name,
//         Body: emailBody
//     }).then(
//         message => alert(message)
//     );
// }
