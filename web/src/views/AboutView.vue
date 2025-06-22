<script setup lang="ts">
import PageView from "@/components/PageView.vue";
</script>

<template>
    <PageView>
        <template #header>
            <h1>about</h1>
        </template>
        <section class="about-content">
            <p>
                <strong>discuit search</strong> is a free, open source search
                api for
                <a href="https://discuit.org" target="_blank" rel="noopener"
                    >discuit.org</a
                >
                posts and communities.
            </p>

            <h2>features</h2>
            <ul>
                <li>fast, full-text search across all public discuit posts</li>
                <li>filter by community, username, or post type</li>
                <li>open api with <a href="/swagger">swagger docs</a></li>
                <li>no ads, tracking, or data collection</li>
                <li>awesome web ui</li>
                <li>open source</li>
            </ul>
            <h2>tech stack</h2>
            <ul>
                <li>
                    <a
                        href="https://meilisearch.com/"
                        target="_blank"
                        rel="noopener"
                        >meilisearch</a
                    >
                    for search
                </li>
                <li>
                    <a
                        href="https://elysiajs.com/"
                        target="_blank"
                        rel="noopener"
                        >elysia</a
                    >
                    (bun) for the api server
                </li>
                <li>
                    <a href="https://vuejs.org/" target="_blank" rel="noopener"
                        >vue 3</a
                    >
                    +
                    <a href="https://vitejs.dev/" target="_blank" rel="noopener"
                        >vite</a
                    >
                    for the frontend
                </li>
                <li>typescript everywhere</li>
                <li>catppuccin for theming</li>
            </ul>
            <h2>contributing</h2>
            <p>
                contributions, bug reports, and suggestions are welcome! check
                out the
                <a
                    href="https://github.com/discuit-community/search"
                    target="_blank"
                    rel="noopener"
                    >github repo</a
                >
                to get started.
            </p>
            <h2>contact</h2>
            <ul>
                <li>email: <a href="mailto:hai@wlo.moe">hai@wlo.moe</a></li>
                <li>discord: <code>sillowww</code></li>
                <li>
                    discuit:
                    <a
                        href="https://discuit.org/@sillowww"
                        target="_blank"
                        rel="noopener"
                        >sillowww</a
                    >
                </li>
            </ul>
            <p class="footer-note">
                made with
                <span style="color: hsl(var(--rosewater))">&lt;3</span> by
                <a href="https://wlo.moe/" target="_blank" rel="noopener"
                    >willow</a
                >
            </p>
        </section>
    </PageView>
</template>

<style scoped>
.about-content {
    max-width: 568px;
    margin: 0 auto;
    padding: 1rem;
    color: hsl(var(--subtext1));
    padding-bottom: 2rem;
}
.about-content h2 {
    margin-top: 2rem;
    color: hsl(var(--mauve));
    font-weight: 600;
    text-transform: lowercase;
}
.about-content ul {
    margin: 1rem 0 1rem 1.5rem;
    padding: 0;
    list-style: disc;
}
.about-content p {
    margin-bottom: 1rem;
}
.about-content a {
    color: hsl(var(--blue));
    text-decoration: underline;
    font-weight: 500;
    transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
    text-transform: lowercase;
}
.about-content a:hover {
    color: hsl(var(--mauve));
}
.about-content code {
    background: hsla(var(--surface1) / 0.7);
    border-radius: 0.3em;
    padding: 0.1em 0.4em;
    font-size: 0.98em;
    color: hsl(var(--text));
    text-transform: lowercase;
}
.footer-note {
    margin-top: 2.5rem;
    font-size: 1.1em;
    color: hsl(var(--rosewater));
    text-align: center;
    user-select: none;
}
</style>
