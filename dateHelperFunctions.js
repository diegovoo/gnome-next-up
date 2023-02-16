const MAX_EVENT_SUMMARY_LENGTH = 35;

/* returns a string shorter than MAX_EVENT_SUMMARY_LENGTH */
function trimLongEventName(summary) {
    if (summary.length > MAX_EVENT_SUMMARY_LENGTH) {
        return summary.substring(0, MAX_EVENT_SUMMARY_LENGTH) + "...";
    }
    else {
        return summary;
    }
}

/* returns events up to 24h from now */
function getTodaysEvents(calendarSource) {
    const src = calendarSource;
    src._loadEvents(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Get event from today at midnight

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todaysEvents = src.getEvents(today, tomorrow);

    return todaysEvents;
}

/* returns events up to a month from now */
function getMonthEvents(calendarSource) {
    const src = calendarSource;
    src._loadEvents(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const month = new Date(today); // 30 days from today
    month.setDate(today.getDate() + 30);

    const monthEvents = src.getEvents(today, month);

    return monthEvents;
}

/* returns current event and next event */
function getNextEventsToDisplay(todaysEvents) {
    const now = new Date();
    const N = todaysEvents.length;

    let currentEvent = null; // The calendar event the user is currently in
    let nextEvent = null; // The next calendar event coming up
    let done = false;

    for (let i = 0; i < N; i++) {
        if (done) break;

        const event = todaysEvents[i];
        const eventStart = event.date;
        const eventEnd = event.end;

        if (now < eventStart) {

            nextEvent = event;
            break;
        }
        else if (now < eventEnd) {

            currentEvent = event;

            // Check whether there's an event after this one
            if (i < N - 1) {

                let someNextEvent;

                for (let j = i + 1; j < N; j++) {

                    someNextEvent = todaysEvents[j];

                    // Check whether the next event overlaps the current event
                    // or whether they start at the same time

                    if (!(someNextEvent.date.valueOf() === currentEvent.date.valueOf())) {
                        nextEvent = someNextEvent;
                        done = true;
                        break;
                    }
                }

            }
        }
    }


    return {
        currentEvent: currentEvent,
        nextEvent: nextEvent
    };
}

/* returns text that is going to be displayed */
function eventStatusToIndicatorText(eventStatus) {

    /* returns string -> time TILL event */
    function displayNextEvent(event) {
        const timeText = getTimeOfEventAsText(event.date);
        const diffText = getTimeToEventAsText(event.date);

        const summary = trimLongEventName(event.summary);

        return `In ${diffText}: ${summary} at ${timeText}`;
    }

    /* returns string -> time till event END and time of NEXT event */
    function displayCurrentEventAndNextEvent(currentEvent, nextEvent) {
        const endsInText = getTimeToEventAsText(currentEvent.end);
        const timeText = getTimeOfEventAsText(nextEvent.date);

        const summary = trimLongEventName(nextEvent.summary);

        return `Ends in ${endsInText}. Next: ${summary} at ${timeText}`;
    }

    /* returns string -> time till event END */
    function displayCurrentEvent(event) {
        const endsInText = getTimeToEventAsText(event.end);

        return `Ends in ${endsInText}: ${event.summary}`;
    }

    /* returns string -> no events */
    function displayNoEvents() {
        return "No events this month!";
    }

    /* extension calls next events to display and then this function calls each of the above
        functions to display the correct text */
    const { currentEvent, nextEvent } = eventStatus;

    if (currentEvent != null) {
        if (nextEvent != null) {
            return displayCurrentEventAndNextEvent(currentEvent, nextEvent);
        }
        else {
            return displayCurrentEvent(currentEvent);
        }
    }
    else {
        if (nextEvent != null) {
            return displayNextEvent(nextEvent);
        }
        else {
            return displayNoEvents();
        }
    }
}

function getTimeOfEventAsText(eventDate) {
    const hrs = eventDate.getHours();
    let mins = eventDate.getMinutes().toString();

    mins = mins.padEnd(2, "0"); // Show e.g. 11am as 11:00 instead of 11:0

    const time = `${hrs}:${mins}`;
    return time;
}

function getTimeToEventAsText(eventDate) {

    const now = new Date();
    const diff = Math.abs(eventDate - now);
    const diffInMins = diff / (1000 * 60);

    const hrDiff = Math.floor(diffInMins / 60);
    const minDiff = Math.ceil(diffInMins % 60);

    let diffText;
    if (hrDiff === 0) {
        diffText = minDiff + " min";
    }
    else {
        diffText = hrDiff + " hr " + minDiff + " min";
    }

    return diffText;
}
