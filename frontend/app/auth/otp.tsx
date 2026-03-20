import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { sendOtp, verifyOtp } from "../../src/api/auth.api";

export default function OTPTestScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOtp = async () => {
    await sendOtp(email);
    setMessage("OTP sent to email");
  };

  const handleVerifyOtp = async () => {
    const res = await verifyOtp(email, otp);
    if (res.verified) {
      setMessage("Verified Successfully!");
    } else {
      setMessage("Invalid OTP");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginBottom: 10 }}
      />
      <Button title="Send OTP" onPress={handleSendOtp} />

      <TextInput
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        style={{ borderWidth: 1, marginVertical: 10 }}
      />
      <Button title="Verify OTP" onPress={handleVerifyOtp} />

      <Text>{message}</Text>
    </View>
  );
}