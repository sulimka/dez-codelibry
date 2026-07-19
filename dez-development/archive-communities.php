<?php

get_header();

global $wp_query;

$hero_image = get('hero-image', true);
$hero_label = get('hero-label', true);
$hero_title = get('hero-title', true);
$hero_text = get('hero-text', true);

$count = $wp_query->found_posts;


// Dropdown
$get_filter_option = static function (array $args): void {
    $param = $args['param'] ?? '';
    $placeholder = $args['placeholder'] ?? '';
    $prefix = $args['prefix'] ?? '';
    $options = $args['options'] ?? [];
    $current = $args['current'] ?? '';
    $right = !empty($args['right']);
    $allow_empty = !array_key_exists('allow_empty', $args) || !empty($args['allow_empty']);

    if ($current !== '' && isset($options[$current])) {
        $label = $prefix . $options[$current];
    } elseif (!$allow_empty && !empty($options)) {
        $current = (string)array_key_first($options);
        $label = $prefix . $options[$current];
    } else {
        $label = $prefix . $placeholder;
        $current = '';
    }

    $dropdown_class = 'filter-select__dropdown' . ($right ? ' filter-select__dropdown--right' : '');
    ?>
    <div
            class="filter-select js-filter-select"
            data-param="<?php echo esc_attr($param); ?>"
            data-value="<?php echo esc_attr($current); ?>"
            data-prefix="<?php echo esc_attr($prefix); ?>"
            data-placeholder="<?php echo esc_attr($placeholder); ?>">

        <button class="filter-select__trigger" type="button">
            <span class="filter-select__label"><?php echo esc_html($label); ?></span>
            <svg class="filter-select__arrow" width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="m12 15.4-6-6L7.4 8l4.6 4.6L16.6 8 18 9.4z"/>
            </svg>
        </button>
        <div class="<?php echo esc_attr($dropdown_class); ?>">
            <ul class="filter-select__list">
                <?php if ($allow_empty): ?>
                    <li class="filter-select__item<?php echo $current === '' ? ' is-active' : ''; ?>"
                        data-value=""><?php echo esc_html($placeholder); ?></li>
                <?php endif; ?>
                <?php foreach ($options as $value => $name): ?>
                    <li class="filter-select__item<?php echo $current === (string)$value ? ' is-active' : ''; ?>"
                        data-value="<?php echo esc_attr($value); ?>"><?php echo esc_html($name); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    </div>
    <?php
};


// 2. Безопасное получение параметров из URL
$get_current_param = static function (string $param): string {
    return isset($_GET[$param]) ? sanitize_text_field(wp_unslash($_GET[$param])) : '';
};

// 3. Карта параметров и таксономий для запроса к БД
$taxonomy_map = [
        'area' => 'community-area',
        'city' => 'community-city',
        'schools' => 'community-schools',
];

$all_terms = get_terms([
        'taxonomy' => array_values($taxonomy_map),
        'hide_empty' => true,
]);

// Распределяем полученные термины по соответствующим таксономиям
$terms_by_tax = [];
if (!is_wp_error($all_terms) && !empty($all_terms)) {
    foreach ($all_terms as $term) {
        $terms_by_tax[$term->taxonomy][$term->slug] = $term->name;
    }
}

// 4. Текстовые метки (Placeholders)
$placeholders = [
        'area' => __('Area', 'test-codelibry'),
        'city' => __('City', 'test-codelibry'),
        'schools' => __('Schools', 'test-codelibry'),
];

// Строим массив основных фильтров
$filters = [];
foreach ($taxonomy_map as $param => $taxonomy) {
    $filters[] = [
            'param' => $param,
            'placeholder' => $placeholders[$param],
            'options' => $terms_by_tax[$taxonomy] ?? [],
            'current' => $get_current_param($param),
    ];
}

// Отдельно настраиваем фильтр сортировки
$sort_filter = [
        'param' => 'orderby',
        'placeholder' => __('A–Z', 'test-codelibry'),
        'prefix' => __('Sort: ', 'test-codelibry'),
        'options' => [
                'title_asc' => __('A–Z', 'test-codelibry'),
                'title_desc' => __('Z–A', 'test-codelibry'),
        ],
        'current' => $get_current_param('orderby') ?: 'title_asc',
        'right' => true,
        'allow_empty' => false,
];
?>

    <!-- Hero section -->
    <section class="community-archive-hero">
        <?php if ($hero_image): ?>
            <div class="community-archive-hero__image">
                <?php echo wp_get_attachment_image($hero_image, 'full', false, [
                        'loading' => false,
                        'decoding' => 'sync',
                        'fetchpriority' => 'high',
                ]); ?>
            </div>
        <?php endif; ?>
        <div class="container-lg">
            <div class="community-archive-hero__content">
                <?php if ($hero_label): ?>
                    <p class="community-archive-hero__label"><?php echo esc_html($hero_label); ?></p>
                <?php endif; ?>
                <?php if ($hero_title): ?>
                    <h1 class="community-archive-hero__title"><?php echo esc_html($hero_title); ?></h1>
                <?php endif; ?>
                <?php if ($hero_text): ?>
                    <p class="community-archive-hero__text"><?php echo esc_html($hero_text); ?></p>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <!-- filter section -->
    <section id="community-filter" class="community-filters">
        <div class="container-lg">
            <div class="community-filters__inner">

                <!-- Поля фильтрации (Левая часть) -->
                <div class="community-filters__fields">
                    <?php
                    // Циклически выводим все динамические фильтры недвижимости
                    foreach ($filters as $filter) {
                        $get_filter_option($filter);
                    }
                    ?>
                </div>

                <!-- Сортировка (Правая часть) -->
                <div class="community-filters__sorting">
                    <?php
                    // Выводим только блок сортировки
                    $get_filter_option($sort_filter);
                    ?>
                </div>

            </div>
        </div>
    </section>

    <!-- Main section -->
    <main class="community-view js-archive-view" data-view="grid">
        <div class="container-lg">
            <div class="community-view__layout">

                <!-- Left column (Map section) -->
                <div class="community-view__map">
                    <div id="community-map" class="community-view__map-container" >
                    </div>
                </div>

                <div class="community-view__right">

                    <div class="community-view__bar">
                        <div class="community-view__count"><?php echo $count; ?>  <?php echo esc_html('Communities Found', 'test-codelibry') ?></div>

                        <button type="button" class="community-view__toggle js-view-toggle" aria-label="change-view">
                            <svg class="community-view__icon community-view__icon--map" width="16" height="16"
                                 viewBox="0 0 16 16">
                                <path d="M1 3.5l4-2 6 2 4-2v11l-4 2-6-2-4 2v-11z" fill="none" stroke="currentColor"
                                      stroke-width="1.5"/>
                            </svg>
                            <svg class="community-view__icon community-view__icon--list" width="16" height="16"
                                 viewBox="0 0 16 16">
                                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="2"/>
                            </svg>

                            <span class="community-view__label community-view__label--map"><?php echo esc_html('Map', 'test-codelibry') ?></span>
                            <span class="community-view__label community-view__label--list"><?php echo esc_html('List', 'test-codelibry') ?></span>
                        </button>
                    </div>

                    <div class="community-view__cards">
                        <?php if (have_posts()): ?>
                            <?php while (have_posts()): the_post(); ?>
                                <?php get_template_part('template-parts/parts/community-card', null, [
                                        'post_id' => get_the_ID(),
                                        'show_location_btn' => true,
                                ]); ?>
                            <?php endwhile; ?>
                        <?php else: ?>
                            <p><?php esc_html_e('No homes found.', 'test-codelibry'); ?></p>
                        <?php endif; ?>
                    </div>

                </div>

            </div>
        </div>
    </main>

<?php get_footer(); ?>