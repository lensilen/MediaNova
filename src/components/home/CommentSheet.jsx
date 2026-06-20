import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";

export function CommentSheet({ 
  visible, 
  onClose, 
  comments = [], 
  onCommentAdded 
}) {
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState(comments);

  const { user, profile } = useAuth();
  
  const currentUserName = 
    profile?.displayName || 
    user?.displayName || 
    (user?.email ? user.email.split('@')[0] : "You");

  const defaultAvatar = `https://ui-avatars.com/api/?name=${currentUserName}&background=2E3748&color=FFFFFF`;
  const currentUserAvatar = profile?.photoURL || user?.photoURL || defaultAvatar;

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      name: currentUserName,
      text: commentText,
      avatar: currentUserAvatar,
    };

    setLocalComments([...localComments, newComment]);
    setCommentText("");
    
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            {/* Langsung menghitung panjang array komentar yang ada */}
            <Text style={styles.title}>
              {localComments.length} Comments
            </Text>

            <Pressable onPress={onClose}>
              <Ionicons
                name="close"
                size={22}
                color="#333"
              />
            </Pressable>
          </View>

          <FlatList
            data={localComments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <Image
                  source={{ uri: item.avatar }}
                  style={styles.avatar}
                />

                <View style={styles.commentContent}>
                  <Text style={styles.commentName}>
                    {item.name}
                  </Text>
                  <Text style={styles.commentText}>
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
          />

          <View style={styles.inputRow}>
            <Image 
              source={{ uri: currentUserAvatar }} 
              style={styles.inputAvatar} 
            />

            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment..."
              style={styles.input}
            />

            <Pressable onPress={handleAddComment}>
              <Ionicons
                name="send"
                size={24}
                color="#1E88E5"
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    height: "70%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  handle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CCC",
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 16, 
    fontWeight: "700",
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentName: {
    fontWeight: "700",
    marginBottom: 2,
  },
  commentText: {
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#EEE",
    paddingTop: 10,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    backgroundColor: "#F3F3F3",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
});