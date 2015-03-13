$(function () {
        $.ajax({
            url: 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + encodeURIComponent('https://conservationecology.wordpress.com/feed/'),
            dataType: 'json',
            success: function (data) {
                var rssPanel_tit = $("#rsspanel_tit");
                var rssPanel_con = $("#rsspanel_con");
                var rssPanel_url = $("#rsspanel_url");
                var rssPanel_full = $("#rsspanel_full");

                var maxPosts = 2;
                var showPostCharacters = 70;
                rssPanel_tit.empty();
                rssPanel_url.empty();
                rssPanel_con.empty();
                rssPanel_full.empty();
                for (var i = 0; i < maxPosts && i < data.responseData.feed.entries.length; i++) {
                    rssPanel_tit.append(data.responseData.feed.entries[i].title);
                    rssPanel_url.append(data.responseData.feed.entries[i].link);
                    rssPanel_full.append("<li><a href='"+data.responseData.feed.entries[i].link+"'>" + data.responseData.feed.entries[i].title + "</a></li><br>")
                    rssPanel_con.append($(data.responseData.feed.entries[i].content).text().substring(0, showPostCharacters - 1) + "...");
                }

            }
        });
    });

