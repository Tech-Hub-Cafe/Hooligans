
import { checkOrderingAvailabilityByType } from "../src/lib/orderingTime";
import { toZonedTime } from "date-fns-tz";

const mockHours = {
    monday_food_ordering_hours: "9am - 5pm",
    tuesday_food_ordering_hours: "9am - 5pm",
    wednesday_food_ordering_hours: "9am - 5pm",
    thursday_food_ordering_hours: "9am - 5pm",
    friday_food_ordering_hours: "Closed", // Closed on Friday for testing
    saturday_food_ordering_hours: "10am - 2pm",
    sunday_food_ordering_hours: "Closed",
};

// Simulation helper
function testTime(description: string, isoString: string, timezone: string, expected: boolean) {
    const date = new Date(isoString);
    const result = checkOrderingAvailabilityByType(mockHours, "food", timezone, date);
    const status = result.isAvailable === expected ? "PASS" : "FAIL";
    console.log(`[${status}] ${description}`);
    console.log(`   Time (ISO): ${isoString}`);
    console.log(`   Timezone: ${timezone}`);
    console.log(`   Expected: ${expected}, Got: ${result.isAvailable}`);
    console.log(`   Message: ${result.message}`);
    if (status === "FAIL") process.exit(1);
}

console.log("Running Timezone Ordering Tests...\n");

// Assume we are testing for a business in Sydney (UTC+10 or UTC+11)

// 1. Monday 10am Sydney Time 
// When it is Monday 10am in Sydney, it should be OPEN.
// 2023-11-20 is a Monday.
// 10am Sydney (AEDT UTC+11) is 2023-11-19T23:00:00Z
testTime(
    "Monday 10am Sydney (Should be OPEN)",
    "2023-11-19T23:00:00Z",
    "Australia/Sydney",
    true
);

// 2. Monday 8pm Sydney Time (Closed)
// 8pm Sydney is 20:00. Range is 9am-5pm. Should be CLOSED.
// 8pm Sydney (AEDT UTC+11) is 2023-11-20T09:00:00Z
testTime(
    "Monday 8pm Sydney (Should be CLOSED - After hours)",
    "2023-11-20T09:00:00Z",
    "Australia/Sydney",
    false
);

// 3. Friday 12pm Sydney Time (Closed all day)
// 2023-11-24 is Friday.
// 12pm Sydney (AEDT UTC+11) is 2023-11-24T01:00:00Z
testTime(
    "Friday 12pm Sydney (Should be CLOSED - Day off)",
    "2023-11-24T01:00:00Z",
    "Australia/Sydney",
    false
);

// 4. US vs Sydney logic check
// If the server thinks it is 4pm Monday in New York (EST UTC-5), but we check for Sydney.
// 4pm NY Monday is 8am Tuesday Sydney (Next day).
// 2023-11-20T16:00:00-05:00 = 2023-11-20T21:00:00Z
// Sydney (UTC+11) = 2023-11-21T08:00:00 (Tuesday 8am).
// Tuesday hours 9am-5pm. 8am is too early. Should be CLOSED.

testTime(
    "Server in NY (Mon 4pm) checks Sydney (Tue 8am) (Should be CLOSED - Too early)",
    "2023-11-20T21:00:00Z",
    "Australia/Sydney",
    false
);

// 5. Server in NY (Mon 6pm) checks Sydney (Tue 10am).
// 6pm NY Monday = 2023-11-20T23:00:00Z
// Sydney (UTC+11) = 2023-11-21T10:00:00 (Tuesday 10am).
// Tuesday hours 9am-5pm. 10am is OPEN.
testTime(
    "Server in NY (Mon 6pm) checks Sydney (Tue 10am) (Should be OPEN)",
    "2023-11-20T23:00:00Z",
    "Australia/Sydney",
    true
);

console.log("\nAll tests passed!");
