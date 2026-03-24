package com.sumeet.dailytracker.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.sumeet.dailytracker.R
import com.sumeet.dailytracker.adapter.RoutineAdapter
import com.sumeet.dailytracker.data.*
import com.sumeet.dailytracker.databinding.FragmentRoutineBinding
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

class RoutineFragment : Fragment() {

    private var _binding: FragmentRoutineBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MainViewModel by activityViewModels()

    private lateinit var morningAdapter: RoutineAdapter
    private lateinit var eveningAdapter: RoutineAdapter
    private lateinit var weeklyAdapter: RoutineAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentRoutineBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        morningAdapter = RoutineAdapter { taskId -> viewModel.toggleRoutine(taskId) }
        eveningAdapter = RoutineAdapter { taskId -> viewModel.toggleRoutine(taskId) }
        weeklyAdapter = RoutineAdapter { taskId -> viewModel.toggleRoutine(taskId) }

        binding.rvMorning.adapter = morningAdapter
        binding.rvEvening.adapter = eveningAdapter
        binding.rvWeekly.adapter = weeklyAdapter

        binding.btnPrev.setOnClickListener { viewModel.navigateDay(false) }
        binding.btnNext.setOnClickListener { viewModel.navigateDay(true) }

        binding.rgArrivalPath.setOnCheckedChangeListener { _, checkedId ->
            val is530 = checkedId == R.id.rb530
            updateEveningTasks(is530, viewModel.dailyData.value?.routine ?: emptyMap())
        }

        viewModel.currentDate.observe(viewLifecycleOwner) { date ->
            val fmt = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy", Locale.getDefault())
            binding.tvDate.text = LocalDate.parse(date).format(fmt)
        }

        viewModel.dailyData.observe(viewLifecycleOwner) { data ->
            val routine = data.routine
            morningAdapter.submitList(MORNING_TASKS.map { task ->
                RoutineAdapter.Item(task.id, task.label, task.time, routine[task.id] ?: false)
            })
            val is530 = binding.rb530.isChecked
            updateEveningTasks(is530, routine)
            weeklyAdapter.submitList(WEEKLY_TASKS.map { task ->
                RoutineAdapter.Item(task.id, task.label, task.time, routine[task.id] ?: false)
            })

            // Progress
            val total = MORNING_TASKS.size + (if (is530) EVENING_530_TASKS else EVENING_730_TASKS).size + WEEKLY_TASKS.size
            val done = ALL_ROUTINE_TASKS.count { routine[it.id] == true }
            binding.progressBar.max = total
            binding.progressBar.progress = done
            binding.tvProgress.text = "$done/$total tasks done"
        }
    }

    private fun updateEveningTasks(is530: Boolean, routine: Map<String, Boolean>) {
        val tasks = if (is530) EVENING_530_TASKS else EVENING_730_TASKS
        eveningAdapter.submitList(tasks.map { task ->
            RoutineAdapter.Item(task.id, task.label, task.time, routine[task.id] ?: false)
        })
        binding.tvEveningLabel.text = if (is530) "Evening Routine (Home by 5:30)" else "Evening Routine (Home by 7:30)"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
