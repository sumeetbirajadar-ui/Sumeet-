package com.sumeet.dailytracker.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.sumeet.dailytracker.R
import com.sumeet.dailytracker.databinding.ItemRoutineTaskBinding

class RoutineAdapter(
    private val onToggle: (String) -> Unit
) : ListAdapter<RoutineAdapter.Item, RoutineAdapter.VH>(Diff) {

    data class Item(val id: String, val label: String, val time: String, val completed: Boolean)

    inner class VH(val binding: ItemRoutineTaskBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Item) {
            binding.tvLabel.text = item.label
            binding.tvTime.text = item.time
            binding.tvTime.visibility = if (item.time.isBlank()) android.view.View.GONE else android.view.View.VISIBLE
            binding.checkbox.isChecked = item.completed
            binding.root.setOnClickListener { onToggle(item.id) }
            binding.checkbox.setOnClickListener { onToggle(item.id) }

            val bgColor = if (item.completed)
                ContextCompat.getColor(binding.root.context, R.color.task_done_bg)
            else
                ContextCompat.getColor(binding.root.context, R.color.task_pending_bg)
            binding.root.setBackgroundColor(bgColor)
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemRoutineTaskBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(getItem(position))

    object Diff : DiffUtil.ItemCallback<Item>() {
        override fun areItemsTheSame(a: Item, b: Item) = a.id == b.id
        override fun areContentsTheSame(a: Item, b: Item) = a == b
    }
}
