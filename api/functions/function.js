function isValidDate(dateString) {
    // First check for the pattern
    if (dateString) {
        if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString))
            return false;

        // Parse the date parts to integers
        var parts = dateString.split("/");
        var day = parseInt(parts[1], 10);
        var month = parseInt(parts[0], 10);
        var year = parseInt(parts[2], 10);

        // Check the ranges of month and year
        if (year < 1000 || year > 3000 || month == 0 || month > 12)
            return false;

        var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        // Adjust for leap years
        if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
            monthLength[1] = 29;

        // Check the range of the day
        return day > 0 && day <= monthLength[month - 1];
    } else {
        return true;
    }

};

exports.diffBetweenDate = function(date, callback) {
    var d1 = new Date(date);
    var d2 = new Date();
    var timeDiff = d2.getTime() - d1.getTime();
    var DaysDiff = Math.round(Math.abs(timeDiff / (1000 * 3600 * 24)));
    var hour = Math.round(Math.abs(timeDiff / (1000 * 3600)));
    var minutes = Math.round(Math.abs(timeDiff / (1000 * 60)));

    if (DaysDiff == 0) {
        if (hour == 0) {
            if (minutes > 0) {
                var time = minutes + ' Minutes ago';
            } else {
                var time = "Few second ago";
            }
        } else {

            console.log('Hours ' + hour + ' Hours');
            var time = hour + ' Hours ago';
        }
    } else {
        console.log('Day ' + DaysDiff + ' Days');
        if (hour > 0) {
            var time = DaysDiff + ' Days and ' + hour + ' hours ago';
        } else {
            var time = DaysDiff + ' Days';
        }
    }
    callback(time);
}