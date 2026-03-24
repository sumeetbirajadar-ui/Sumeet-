package com.sumeet.dailytracker.adapter

import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.sumeet.dailytracker.data.Expense
import com.sumeet.dailytracker.databinding.ItemExpenseBinding

class ExpenseAdapter(
    private val onChanged: (Int, Expense) -> Unit
) : RecyclerView.Adapter<ExpenseAdapter.VH>() {

    private val items = mutableListOf<Expense>()

    fun submitList(list: List<Expense>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    inner class VH(val binding: ItemExpenseBinding) : RecyclerView.ViewHolder(binding.root) {
        private var itemWatcher: TextWatcher? = null
        private var amountWatcher: TextWatcher? = null

        fun bind(position: Int, expense: Expense) {
            itemWatcher?.let { binding.etItem.removeTextChangedListener(it) }
            amountWatcher?.let { binding.etAmount.removeTextChangedListener(it) }

            binding.etItem.setText(expense.item)
            binding.etAmount.setText(expense.amount)

            itemWatcher = object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
                override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    if (adapterPosition != RecyclerView.NO_ID.toInt()) {
                        val cur = items.getOrElse(adapterPosition) { Expense() }
                        onChanged(adapterPosition, cur.copy(item = s?.toString() ?: ""))
                    }
                }
            }

            amountWatcher = object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
                override fun onTextChanged(s: CharSequence?, st: Int, b: Int, c: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    if (adapterPosition != RecyclerView.NO_ID.toInt()) {
                        val cur = items.getOrElse(adapterPosition) { Expense() }
                        onChanged(adapterPosition, cur.copy(amount = s?.toString() ?: ""))
                    }
                }
            }

            binding.etItem.addTextChangedListener(itemWatcher)
            binding.etAmount.addTextChangedListener(amountWatcher)
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemExpenseBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(position, items.getOrElse(position) { Expense() })
    override fun getItemCount() = items.size
}
