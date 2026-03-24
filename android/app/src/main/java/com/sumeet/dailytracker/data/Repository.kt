package com.sumeet.dailytracker.data

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

data class Expense(val item: String = "", val amount: String = "")

data class DailyDataModel(
    val date: String,
    val routine: MutableMap<String, Boolean> = mutableMapOf(),
    val todo: MutableList<String> = MutableList(10) { "" },
    val expenses: MutableList<Expense> = MutableList(5) { Expense() },
    val reminders: MutableList<String> = MutableList(5) { "" },
    val gratitude: MutableList<String> = MutableList(3) { "" },
    val reflection: MutableList<String> = MutableList(2) { "" },
    val sections: MutableMap<String, MutableList<String>> = mutableMapOf(
        "xi_a" to MutableList(4) { "" },
        "xi_b" to MutableList(4) { "" },
        "kcet" to MutableList(4) { "" },
        "neet" to MutableList(4) { "" }
    )
)

data class WeeklyReviewModel(
    val weekStarting: String,
    val wins: MutableList<String> = MutableList(3) { "" },
    val challenges: MutableList<String> = MutableList(3) { "" },
    val goalsNextWeek: MutableList<String> = MutableList(3) { "" },
    var overallRating: Int = 0
)

class Repository(context: Context) {
    private val db = AppDatabase.getInstance(context)
    private val dailyDao = db.dailyDataDao()
    private val weeklyDao = db.weeklyReviewDao()
    private val gson = Gson()

    // ---- Daily Data ----

    suspend fun getDailyData(date: String): DailyDataModel {
        val entity = dailyDao.getByDate(date) ?: return DailyDataModel(date)
        return entity.toModel(gson)
    }

    suspend fun saveDailyData(model: DailyDataModel) {
        dailyDao.insert(model.toEntity(gson))
    }

    suspend fun getDailyDataRange(startDate: String, endDate: String): List<DailyDataModel> {
        return dailyDao.getByDateRange(startDate, endDate).map { it.toModel(gson) }
    }

    // ---- Weekly Review ----

    suspend fun getWeeklyReview(weekKey: String): WeeklyReviewModel {
        val entity = weeklyDao.getByWeek(weekKey) ?: return WeeklyReviewModel(weekKey)
        return entity.toModel(gson)
    }

    suspend fun saveWeeklyReview(model: WeeklyReviewModel) {
        weeklyDao.insert(model.toEntity(gson))
    }

    fun getAllWeeklyReviewsLive() = weeklyDao.getAllLive()
}

// ---- Extension mappers ----

private fun DailyDataEntity.toModel(gson: Gson): DailyDataModel {
    val mapType = object : TypeToken<MutableMap<String, Boolean>>() {}.type
    val listType = object : TypeToken<MutableList<String>>() {}.type
    val expenseType = object : TypeToken<MutableList<Expense>>() {}.type
    val sectionsType = object : TypeToken<MutableMap<String, MutableList<String>>>() {}.type

    return DailyDataModel(
        date = date,
        routine = gson.fromJson(routineJson, mapType) ?: mutableMapOf(),
        todo = (gson.fromJson(todoJson, listType) as? MutableList<String>)?.let { list ->
            if (list.size < 10) { repeat(10 - list.size) { list.add("") }; list } else list
        } ?: MutableList(10) { "" },
        expenses = (gson.fromJson(expensesJson, expenseType) as? MutableList<Expense>)?.let { list ->
            if (list.size < 5) { repeat(5 - list.size) { list.add(Expense()) }; list } else list
        } ?: MutableList(5) { Expense() },
        reminders = (gson.fromJson(remindersJson, listType) as? MutableList<String>)?.let { list ->
            if (list.size < 5) { repeat(5 - list.size) { list.add("") }; list } else list
        } ?: MutableList(5) { "" },
        gratitude = (gson.fromJson(gratitudeJson, listType) as? MutableList<String>)?.let { list ->
            if (list.size < 3) { repeat(3 - list.size) { list.add("") }; list } else list
        } ?: MutableList(3) { "" },
        reflection = (gson.fromJson(reflectionJson, listType) as? MutableList<String>)?.let { list ->
            if (list.size < 2) { repeat(2 - list.size) { list.add("") }; list } else list
        } ?: MutableList(2) { "" },
        sections = gson.fromJson(sectionsJson, sectionsType) ?: mutableMapOf(
            "xi_a" to MutableList(4) { "" },
            "xi_b" to MutableList(4) { "" },
            "kcet" to MutableList(4) { "" },
            "neet" to MutableList(4) { "" }
        )
    )
}

private fun DailyDataModel.toEntity(gson: Gson) = DailyDataEntity(
    date = date,
    routineJson = gson.toJson(routine),
    todoJson = gson.toJson(todo),
    expensesJson = gson.toJson(expenses),
    remindersJson = gson.toJson(reminders),
    gratitudeJson = gson.toJson(gratitude),
    reflectionJson = gson.toJson(reflection),
    sectionsJson = gson.toJson(sections)
)

private fun WeeklyReviewEntity.toModel(gson: Gson): WeeklyReviewModel {
    val listType = object : TypeToken<MutableList<String>>() {}.type
    return WeeklyReviewModel(
        weekStarting = weekStarting,
        wins = gson.fromJson(winsJson, listType) ?: MutableList(3) { "" },
        challenges = gson.fromJson(challengesJson, listType) ?: MutableList(3) { "" },
        goalsNextWeek = gson.fromJson(goalsNextWeekJson, listType) ?: MutableList(3) { "" },
        overallRating = overallRating
    )
}

private fun WeeklyReviewModel.toEntity(gson: Gson) = WeeklyReviewEntity(
    weekStarting = weekStarting,
    winsJson = gson.toJson(wins),
    challengesJson = gson.toJson(challenges),
    goalsNextWeekJson = gson.toJson(goalsNextWeek),
    overallRating = overallRating
)
