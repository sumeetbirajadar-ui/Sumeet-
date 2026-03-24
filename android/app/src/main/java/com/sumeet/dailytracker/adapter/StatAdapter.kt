package com.sumeet.dailytracker.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.sumeet.dailytracker.databinding.ItemStatBinding
import com.sumeet.dailytracker.ui.MainViewModel

class StatAdapter : ListAdapter<MainViewModel.TaskStat, StatAdapter.VH>(Diff) {

    inner class VH(val binding: ItemStatBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(stat: MainViewModel.TaskStat) {
            binding.tvLabel.text = stat.label
            binding.tvCount.text = "${stat.count}/7"
            binding.progressBar.progress = stat.percentage
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemStatBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(getItem(position))

    object Diff : DiffUtil.ItemCallback<MainViewModel.TaskStat>() {
        override fun areItemsTheSame(a: MainViewModel.TaskStat, b: MainViewModel.TaskStat) = a.label == b.label
        override fun areContentsTheSame(a: MainViewModel.TaskStat, b: MainViewModel.TaskStat) = a == b
    }
}
