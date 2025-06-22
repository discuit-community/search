<script setup>
import { useSlots } from "vue";

const slots = useSlots();
const noFooter = slots.footer === undefined;
</script>

<template>
    <div :class="['page-view', { 'no-footer': noFooter }]">
        <div class="header">
            <slot name="header"></slot>
        </div>
        <div class="content-wrapper">
            <div class="content">
                <div class="scroll-container">
                    <slot></slot>
                </div>
            </div>
        </div>
        <div class="footer" v-if="!noFooter">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<style scoped>
.page-view {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr;
    grid-template-areas:
        "header"
        "main"
        "footer";
    height: 100dvh;

    &.no-footer {
        grid-template-rows: auto 1fr;
        grid-template-areas:
            "header"
            "main";

        .content-wrapper {
            margin-bottom: 1rem;
        }
    }
}

.header {
    grid-area: header;
    margin: 1rem auto;
}

.content-wrapper {
    grid-area: main;

    display: flex;
    justify-content: center;
    min-height: 0;
    overflow-y: auto;
    transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

    .content {
        position: relative;
        max-width: 568px;
        width: 100%;
        max-height: 100%;
        display: flex;
        flex-direction: column;

        background: hsla(var(--mantle) / 1);
        border: 1px solid hsla(var(--subtext0) / 0.1);
        border-radius: 3rem;
        overflow: hidden;

        .scroll-container {
            flex: 1;
            overflow-y: auto;
            box-sizing: border-box;

            &::-webkit-scrollbar {
                width: 0.5rem;
                height: 0.5rem;
            }

            &::-webkit-scrollbar-thumb {
                background-color: hsla(var(--base) / 0.5);
                border-radius: 0.25rem;
            }

            &::-webkit-scrollbar-track {
                background-color: transparent;
            }
        }
    }
}

.header,
.footer {
    max-width: 568px;
    width: 100%;
    margin: 0.5rem auto;
}
</style>
