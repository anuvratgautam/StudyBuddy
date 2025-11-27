pipeline {
  agent any

  environment {
    REGISTRY = 'docker.io' // or your registry
    REPO = 'yourdockerhubusername/studybuddy'
    IMAGE_BACKEND = "${REPO}-backend"
    IMAGE_FRONTEND = "${REPO}-frontend"
    KUBECONFIG_CRED = 'KUBE_CONFIG' // set this in Jenkins credentials (Secret file)
    DOCKER_CREDS = 'DOCKERHUB_CREDS' // set in Jenkins credentials
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Build Backend Image') {
      steps {
        sh 'docker --version || true'
        script {
          sh "docker build -t ${IMAGE_BACKEND}:${env.BUILD_NUMBER} ./backend"
        }
      }
    }
    stage('Build Frontend Image') {
      steps {
        script {
          sh "docker build -t ${IMAGE_FRONTEND}:${env.BUILD_NUMBER} ./frontend"
        }
      }
    }
    stage('Login & Push') {
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin ${REGISTRY}"
          sh "docker tag ${IMAGE_BACKEND}:${env.BUILD_NUMBER} ${REGISTRY}/${IMAGE_BACKEND}:latest"
          sh "docker tag ${IMAGE_FRONTEND}:${env.BUILD_NUMBER} ${REGISTRY}/${IMAGE_FRONTEND}:latest"
          sh "docker push ${REGISTRY}/${IMAGE_BACKEND}:latest"
          sh "docker push ${REGISTRY}/${IMAGE_FRONTEND}:latest"
        }
      }
    }
    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: env.KUBECONFIG_CRED, variable: 'KUBECONFIG_FILE')]) {
          sh 'mkdir -p $HOME/.kube'
          sh 'cp $KUBECONFIG_FILE $HOME/.kube/config'
          sh 'kubectl version --client'
          sh 'kubectl apply -f k8s/namespace.yaml'
          sh 'kubectl apply -f k8s/configmap.yaml'
          sh 'kubectl apply -f k8s/secret.yaml'
          sh 'kubectl apply -f k8s/backend-deployment.yaml'
          sh 'kubectl apply -f k8s/backend-service.yaml'
          sh 'kubectl apply -f k8s/frontend-deployment.yaml'
          sh 'kubectl apply -f k8s/frontend-service.yaml'
          sh 'kubectl apply -f k8s/ingress.yaml'
        }
      }
    }
  }
  post {
    always {
      cleanWs()
    }
  }
}
