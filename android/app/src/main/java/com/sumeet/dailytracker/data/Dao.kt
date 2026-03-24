package com.sumeet.dailytracker.data

import androidx.lifecycle.LiveData
import androidx.room.*

@Dao
interface DailyDataDao {
    @Query("SELECT * FROM daily_data WHERE date = :date")
    suspend fun getByDate(date: String): DailyDataEntity?

    @Query("SELECT * FROM daily_data WHERE date BETWEEN :startDate AND :endDate")
    suspend fun getByDateRange(startDate: String, endDate: String): List<DailyDataEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(data: DailyDataEntity)

    @Delete
    suspend fun delete(data: DailyDataEntity)
}

@Dao
interface WeeklyReviewDao {
    @Query("SELECT * FROM weekly_review WHERE weekStarting = :weekKey")
    suspend fun getByWeek(weekKey: String): WeeklyReviewEntity?

    @Query("SELECT * FROM weekly_review ORDER BY weekStarting DESC")
    fun getAllLive(): LiveData<List<WeeklyReviewEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(review: WeeklyReviewEntity)
}
