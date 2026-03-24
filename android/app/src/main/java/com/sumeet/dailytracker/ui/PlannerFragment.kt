package com.sumeet.dailytracker.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.sumeet.dailytracker.adapter.StringListAdapter
import com.sumeet.dailytracker.adapter.ExpenseAdapter
import com.sumeet.dailytracker.adapter.SectionAdapter
import com.sumeet.dailytracker.data.Expense
import com.sumeet.dailytracker.databinding.FragmentPlannerBinding
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

class PlannerFragment : Fragment() {

    private var _binding: FragmentPlannerBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MainViewModel by activityViewModels()

    private lateinit var todoAdapter: StringListAdapter
    private lateinit var expenseAdapter: ExpenseAdapter
    private lateinit var reminderAdapter: StringListAdapter
    private lateinit var gratitudeAdapter: StringListAdapter
    private lateinit var reflectionAdapter: StringListAdapter
    private lateinit var xiAAdapter: SectionAdapter
    private lateinit var xiBAdapter: SectionAdapter
    private lateinit var kcetAdapter: SectionAdapter
    private lateinit var neetAdapter: SectionAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentPlannerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        todoAdapter = StringListAdapter(hint = "Task…") { idx, v -> viewModel.updateTodo(idx, v) }
        expenseAdapter = ExpenseAdapter { idx, exp -> viewModel.updateExpense(idx, exp) }
        reminderAdapter = StringListAdapter(hint = "Reminder…") { idx, v -> viewModel.updateReminder(idx, v) }
        gratitudeAdapter = StringListAdapter(hint = "I'm grateful for…") { idx, v -> viewModel.updateGratitude(idx, v) }
        reflectionAdapter = StringListAdapter(hint = "Reflection…") { idx, v -> viewModel.updateReflection(idx, v) }
        xiAAdapter = SectionAdapter(hint = "XI-A note…") { idx, v -> viewModel.updateSection("xi_a", idx, v) }
        xiBAdapter = SectionAdapter(hint = "XI-B note…") { idx, v -> viewModel.updateSection("xi_b", idx, v) }
        kcetAdapter = SectionAdapter(hint = "KCET note…") { idx, v -> viewModel.updateSection("kcet", idx, v) }
        neetAdapter = SectionAdapter(hint = "NEET note…") { idx, v -> viewModel.updateSection("neet", idx, v) }

        binding.rvTodo.adapter = todoAdapter
        binding.rvExpenses.adapter = expenseAdapter
        binding.rvReminders.adapter = reminderAdapter
        binding.rvGratitude.adapter = gratitudeAdapter
        binding.rvReflection.adapter = reflectionAdapter
        binding.rvXiA.adapter = xiAAdapter
        binding.rvXiB.adapter = xiBAdapter
        binding.rvKcet.adapter = kcetAdapter
        binding.rvNeet.adapter = neetAdapter

        binding.btnPrev.setOnClickListener { viewModel.navigateDay(false) }
        binding.btnNext.setOnClickListener { viewModel.navigateDay(true) }

        viewModel.currentDate.observe(viewLifecycleOwner) { date ->
            val fmt = DateTimeFormatter.ofPattern("EEE, MMM d", Locale.getDefault())
            binding.tvDate.text = LocalDate.parse(date).format(fmt)
        }

        viewModel.dailyData.observe(viewLifecycleOwner) { data ->
            todoAdapter.submitList(data.todo)
            expenseAdapter.submitList(data.expenses)
            reminderAdapter.submitList(data.reminders)
            gratitudeAdapter.submitList(data.gratitude)
            reflectionAdapter.submitList(data.reflection)
            xiAAdapter.submitList(data.sections["xi_a"] ?: emptyList())
            xiBAdapter.submitList(data.sections["xi_b"] ?: emptyList())
            kcetAdapter.submitList(data.sections["kcet"] ?: emptyList())
            neetAdapter.submitList(data.sections["neet"] ?: emptyList())
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
