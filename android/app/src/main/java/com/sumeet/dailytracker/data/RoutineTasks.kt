package com.sumeet.dailytracker.data

data class RoutineTask(val id: String, val label: String, val time: String = "", val group: String)

val MORNING_TASKS = listOf(
    RoutineTask("college_work", "Never done college work in home", group = "morning"),
    RoutineTask("wake_up", "Wake up & Work", "4 AM", group = "morning"),
    RoutineTask("yoga", "Yoga & Pranayam", "7–7:30 AM", group = "morning"),
    RoutineTask("boosters", "Test boosters & Gut cleansers", group = "morning"),
    RoutineTask("work_session", "Work", "4–7 AM", group = "morning"),
    RoutineTask("mcq", "100 MCQ solved", group = "morning"),
)

val EVENING_530_TASKS = listOf(
    RoutineTask("bath_530", "Take a bath", group = "evening_530"),
    RoutineTask("meditation", "Meditation", "6–6:30 PM", group = "evening_530"),
    RoutineTask("wife_530", "Wife time / Other", "6:30–8:30 PM", group = "evening_530"),
    RoutineTask("study_530", "Study / Content mgmt", "8:30–10 PM", group = "evening_530"),
)

val EVENING_730_TASKS = listOf(
    RoutineTask("bath_730", "Take a bath", group = "evening_730"),
    RoutineTask("wife_730", "Wife time / Other", "8–9 PM", group = "evening_730"),
    RoutineTask("study_730", "Study / Content mgmt", "9–10 PM", group = "evening_730"),
)

val WEEKLY_TASKS = listOf(
    RoutineTask("hair_dye", "Beard/Hair dye", "(Sun, Wed)", group = "weekly"),
    RoutineTask("face_care", "Face/Personal Care", "(Sun, Thu, Mon)", group = "weekly"),
    RoutineTask("hair_oil", "Hair oil/Massage", "(Sat, Tue)", group = "weekly"),
    RoutineTask("calls", "Calls", "(Sat, Sun)", group = "weekly"),
)

val ALL_ROUTINE_TASKS = MORNING_TASKS + EVENING_530_TASKS + EVENING_730_TASKS + WEEKLY_TASKS
