function gen_mail_to_link(lhs,subject)
{
		document.write("<a HREF=\"mailto");
		document.write(":" + lhs);
		document.write("?subject=" + subject + "\">" + lhs + "<\/a>"); 
} 