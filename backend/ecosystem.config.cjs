module.exports = {
  apps: [
    {
      name: "autocomplete-api",
      script: "./dist/index.js",
      instances: 4,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        NODE_CLUSTER_SCHED_POLICY: "rr",
      },
    },
  ],
};
