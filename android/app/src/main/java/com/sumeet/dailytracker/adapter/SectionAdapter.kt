package com.sumeet.dailytracker.adapter

import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.sumeet.dailytracker.databinding.ItemTextInputBinding

class SectionAdapter(
    private val hint: String,
    private val onChanged: (Int, String) -> Unit
) : RecyclerView.Adapter<SectionAdapter.VH>() {

    private val items = mutableListOf<String>()

    fun submitList(list: List<String>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    inner class VH(val binding: ItemTextInputBinding) : RecyclerView.ViewHolder(binding.root) {
        private var watcher: TextWatcher? = null

        fun bind(position: Int, value: String) {
            watcher?.let { binding.etInput.removeTextChangedListener(it) }
            binding.etInput.hint = hint
            binding.etInput.setText(value)
            watcher = object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
                override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    if (adapterPosition != RecyclerView.NO_ID.toInt()) {
                        onChanged(adapterPosition, s?.toString() ?: "")
                    }
                }
            }
            binding.etInput.addTextChangedListener(watcher)
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemTextInputBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(position, items.getOrElse(position) { "" })
    override fun getItemCount() = items.size
}
