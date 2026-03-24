package com.sumeet.dailytracker.ui

import android.app.Application
import androidx.lifecycle.*
import com.sumeet.dailytracker.data.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.DayOfWeek
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAdjusters

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repo = Repository(application)
    private val fmt = DateTimeFormatter.ISO_LOCAL_DATE

    private val _currentDate = MutableLiveData(LocalDate.now().format(fmt))
    val currentDate: LiveData<String> = _currentDate

    private val _dailyData = MutableLiveData<DailyDataModel>()
    val dailyData: LiveData<DailyDataModel> = _dailyData

    private val _weeklyReview = MutableLiveData<WeeklyReviewModel>()
    val weeklyReview: LiveData<WeeklyReviewModel> = _weeklyReview

    private val _weeklyStats = MutableLiveData<WeeklyStats>()
    val weeklyStats: LiveData<WeeklyStats> = _weeklyStats

    data class TaskStat(val label: String, val count: Int, val percentage: Int)
    data class WeeklyStats(val stats: List<TaskStat>, val totalExpenses: Double, val gratitudeHighlights: List<String>)

    init {
        loadCurrentDate()
    }

    private fun loadCurrentDate() {
        val date = _currentDate.value ?: return
        viewModelScope.launch {
            _dailyData.value = repo.getDailyData(date)
            loadWeeklyReview(date)
            loadWeeklyStats(date)
        }
    }

    fun navigateDay(forward: Boolean) {
        val cur = LocalDate.parse(_currentDate.value, fmt)
        _currentDate.value = (if (forward) cur.plusDays(1) else cur.minusDays(1)).format(fmt)
        loadCurrentDate()
    }

    fun toggleRoutine(taskId: String) {
        val current = _dailyData.value ?: return
        val updated = current.copy(
            routine = current.routine.toMutableMap().also { it[taskId] = !(it[taskId] ?: false) }
        )
        _dailyData.value = updated
        viewModelScope.launch { repo.saveDailyData(updated) }
    }

    fun updateTodo(index: Int, value: String) {
        val current = _dailyData.value ?: return
        val list = current.todo.toMutableList().also { it[index] = value }
        val updated = current.copy(todo = list)
        _dailyData.value = updated
        viewModelScope.launch { repo.saveDailyData(updated) }
    }

    fun updateExpense(index: Int, expense: Expense) {
        val current = _dailyData.value ?: return
        val list = current.expenses.toMutableList().also { it[index] = expense }
        val updated = current.copy(expenses = list)
        _dailyData.value = updated
        viewModelScope.launch { repo.saveDailyData(updated) }
    }

    fun updateReminder(index: Int, value: String) {
        val current = _dailyData.value ?: return
        val list = current.reminders.toMutableList().also { it[index] = value }
        val updated = current.copy(reminders = list)
        _dailyData.value = updated
        viewModelScope.launch { repo.saveDailyData(updated) }
    }

    fun updateGratitude(index: Int, value: String) {
        val current = _dailyData.value ?: return
        val list = current.gratitude.toMutableList().also { it[index] = value }
        val updated = current.copy(gratitude = list)
        _dailyData.value = updated
        viewModelScope.launch { repo.saveDailyData(updated) }
    }

    fun updateReflection(index: Int, value: String) {
        val current = _dailyData.value ?: return
        val list = current.reflection.toMutableList().also { it[index] = value }
        val updated = current.copy(reflection = list)
        _dailyData.value = updated
        viewModelScope.launch { repo.saveDailyData(updated) }
    }

    fun updateSection(section: String, index: Int, value: String) {
        val current = _dailyData.value ?: return
        val sections = current.sections.toMutableMap()
        val sectionList = sections[section]?.toMutableList() ?: MutableList(4) { "" }
        sectionList[index] = value
        sections[section] = sectionList
        val updated = current.copy(sections = sections)
        _dailyData.value = updated
        viewModelScope.launch { repo.saveDailyData(updated) }
    }

    fun updateWeeklyField(field: String, index: Int, value: String) {
        val current = _weeklyReview.value ?: return
        val updated = when (field) {
            "wins" -> current.copy(wins = current.wins.toMutableList().also { it[index] = value })
            "challenges" -> current.copy(challenges = current.challenges.toMutableList().also { it[index] = value })
            "goals" -> current.copy(goalsNextWeek = current.goalsNextWeek.toMutableList().also { it[index] = value })
            else -> return
        }
        _weeklyReview.value = updated
        viewModelScope.launch { repo.saveWeeklyReview(updated) }
    }

    fun updateWeeklyRating(rating: Int) {
        val current = _weeklyReview.value ?: return
        val updated = current.copy(overallRating = rating)
        _weeklyReview.value = updated
        viewModelScope.launch { repo.saveWeeklyReview(updated) }
    }

    private suspend fun loadWeeklyReview(date: String) {
        val weekKey = getWeekMonday(date)
        _weeklyReview.value = repo.getWeeklyReview(weekKey)
    }

    private suspend fun loadWeeklyStats(date: String) {
        val monday = getWeekMonday(date)
        val start = LocalDate.parse(monday, fmt)
        val weekDates = (0..6).map { start.plusDays(it.toLong()).format(fmt) }
        val dayDataList = repo.getDailyDataRange(weekDates.first(), weekDates.last())
        val dayDataMap = dayDataList.associateBy { it.date }

        val stats = ALL_ROUTINE_TASKS.map { task ->
            val count = weekDates.count { dayDataMap[it]?.routine?.get(task.id) == true }
            TaskStat(task.label, count, (count * 100 / 7))
        }

        var totalExpenses = 0.0
        weekDates.forEach { d ->
            dayDataMap[d]?.expenses?.forEach { e -> totalExpenses += e.amount.toDoubleOrNull() ?: 0.0 }
        }

        val gratitude = weekDates.flatMap { d ->
            dayDataMap[d]?.gratitude?.filter { it.isNotBlank() } ?: emptyList()
        }

        _weeklyStats.value = WeeklyStats(stats, totalExpenses, gratitude)
    }

    private fun getWeekMonday(date: String): String {
        val d = LocalDate.parse(date, fmt)
        return d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).format(fmt)
    }
}
