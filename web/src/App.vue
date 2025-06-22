<script setup lang="ts">
import FooterSection from "@/components/FooterSection.vue";
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
    <RouterView />
    <FooterSection />
</template>

<style scoped></style>
