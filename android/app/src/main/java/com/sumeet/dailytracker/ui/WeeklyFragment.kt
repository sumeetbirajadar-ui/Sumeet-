package com.sumeet.dailytracker.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.RatingBar
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.sumeet.dailytracker.adapter.StringListAdapter
import com.sumeet.dailytracker.adapter.StatAdapter
import com.sumeet.dailytracker.databinding.FragmentWeeklyBinding

class WeeklyFragment : Fragment() {

    private var _binding: FragmentWeeklyBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MainViewModel by activityViewModels()

    private lateinit var winsAdapter: StringListAdapter
    private lateinit var challengesAdapter: StringListAdapter
    private lateinit var goalsAdapter: StringListAdapter
    private lateinit var statsAdapter: StatAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentWeeklyBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        winsAdapter = StringListAdapter(hint = "A win this week…") { idx, v -> viewModel.updateWeeklyField("wins", idx, v) }
        challengesAdapter = StringListAdapter(hint = "A challenge…") { idx, v -> viewModel.updateWeeklyField("challenges", idx, v) }
        goalsAdapter = StringListAdapter(hint = "Goal for next week…") { idx, v -> viewModel.updateWeeklyField("goals", idx, v) }
        statsAdapter = StatAdapter()

        binding.rvWins.adapter = winsAdapter
        binding.rvChallenges.adapter = challengesAdapter
        binding.rvGoals.adapter = goalsAdapter
        binding.rvStats.adapter = statsAdapter

        binding.ratingBar.onRatingBarChangeListener = RatingBar.OnRatingBarChangeListener { _, rating, fromUser ->
            if (fromUser) viewModel.updateWeeklyRating(rating.toInt())
        }

        viewModel.weeklyReview.observe(viewLifecycleOwner) { review ->
            winsAdapter.submitList(review.wins)
            challengesAdapter.submitList(review.challenges)
            goalsAdapter.submitList(review.goalsNextWeek)
            binding.ratingBar.rating = review.overallRating.toFloat()
            binding.tvWeekStart.text = "Week of ${review.weekStarting}"
        }

        viewModel.weeklyStats.observe(viewLifecycleOwner) { stats ->
            statsAdapter.submitList(stats.stats)
            binding.tvTotalExpenses.text = "₹%.2f total expenses this week".format(stats.totalExpenses)
            val gratitude = stats.gratitudeHighlights.take(5)
            binding.tvGratitudeHighlights.text = if (gratitude.isEmpty()) "No gratitude entries yet"
            else gratitude.joinToString("\n• ", prefix = "• ")
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
