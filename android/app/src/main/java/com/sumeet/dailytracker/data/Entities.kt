package com.sumeet.dailytracker.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_data")
data class DailyDataEntity(
    @PrimaryKey val date: String,
    // Routine booleans stored as JSON string map
    val routineJson: String = "{}",
    // Todo list as JSON array of strings
    val todoJson: String = "[]",
    // Expenses as JSON array of {item, amount} objects
    val expensesJson: String = "[]",
    // Reminders as JSON array of strings
    val remindersJson: String = "[]",
    // Gratitude as JSON array of strings
    val gratitudeJson: String = "[]",
    // Reflection as JSON array of strings
    val reflectionJson: String = "[]",
    // Sections xi_a, xi_b, kcet, neet as JSON object
    val sectionsJson: String = "{}"
)

@Entity(tableName = "weekly_review")
data class WeeklyReviewEntity(
    @PrimaryKey val weekStarting: String,
    val winsJson: String = "[]",
    val challengesJson: String = "[]",
    val goalsNextWeekJson: String = "[]",
    val overallRating: Int = 0
)
