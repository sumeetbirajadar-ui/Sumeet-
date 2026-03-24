package com.sumeet.dailytracker.ui

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.sumeet.dailytracker.databinding.ActivityLoginBinding

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var prefs: SharedPreferences
    private val correctPin = "4321"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)

        // Auto-login if already authenticated
        if (prefs.getBoolean("is_authenticated", false)) {
            goToMain()
            return
        }

        binding.btnLogin.setOnClickListener {
            val pin = binding.etPin.text?.toString() ?: ""
            if (pin == correctPin) {
                prefs.edit().putBoolean("is_authenticated", true).apply()
                goToMain()
            } else {
                binding.tilPin.error = "Incorrect PIN. Try again."
                binding.etPin.text?.clear()
            }
        }
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
